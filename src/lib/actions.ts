"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, findUserByLogin, requireUser, usernameTaken } from "./auth";
import { exec, one, q } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { awardXp, logUsage, notify, touchStreak, usageCount, whiteboardRemaining, PLANS } from "./points";
import { type Lesson } from "./lesson";
import { TOPICS, detectTopic, topicByKey } from "./lesson/topics";
import { extendLesson, generateLesson, generateQuiz, summarizeUpload, tutorReply } from "./ai";
import { slugify, readingTime, plural } from "./utils";
import { buildFlashcards, buildQuiz } from "./lesson";

export type FormState = { error?: string; ok?: string };

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/* ------------------------------ auth ------------------------------ */

export async function signupAction(_prev: FormState | undefined, form: FormData): Promise<FormState> {
  const email = text(form, "email").toLowerCase();
  const usernameRaw = text(form, "username").toLowerCase();
  const displayName = text(form, "display_name");
  const password = text(form, "password");

  if (!email.includes("@") || !email.includes(".")) return { error: "Podaj poprawny adres e-mail." };
  if (!displayName) return { error: "Jak mamy do ciebie mówić?" };
  if (password.length < 8) return { error: "Hasło musi mieć co najmniej 8 znaków." };
  const username = slugify(usernameRaw || displayName) || `uczen-${Date.now() % 10000}`;
  if (await usernameTaken(username, email)) {
    return { error: "Ta nazwa użytkownika lub e-mail już istnieje." };
  }

  const id = crypto.randomUUID();
  const hue = Math.floor(Math.random() * 360);
  await exec(
    `insert into profiles (id, username, email, password_hash, display_name, avatar_hue, persona_vibe, persona_warmth, persona_emojis)
     values ($1,$2,$3,$4,$5,$6,'friend',3,2)`,
    [id, username, email, hashPassword(password), displayName, hue],
  );
  await touchStreak(id);
  await createSession(id);
  redirect("/home");
}

export async function loginAction(_prev: FormState | undefined, form: FormData): Promise<FormState> {
  const login = text(form, "login");
  const password = text(form, "password");
  if (!login || !password) return { error: "Wpisz login i hasło." };
  const user = await findUserByLogin(login);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Nieprawidłowy login lub hasło." };
  }
  await createSession(user.id);
  redirect("/home");
}

export async function demoLoginAction(form: FormData): Promise<void> {
  const who = text(form, "who") || "kasia";
  const user = await findUserByLogin(`${who}@notara.app`);
  if (!user) redirect("/login");
  await createSession(user.id);
  redirect("/home");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

/* ------------------------------ chat ------------------------------ */

export async function createChatAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const prompt = text(form, "prompt");
  if (!prompt) redirect("/chat");

  const used = await usageCount(user.id, "chat", 1);
  const plan = PLANS[(user.plan as keyof typeof PLANS) ?? "free"] ?? PLANS.free;
  if (used >= plan.chatsPerDay) redirect("/pricing?limit=chat");

  const reply = await tutorReply(prompt, {
    vibe: user.persona_vibe,
    warmth: user.persona_warmth,
    emojis: user.persona_emojis,
    language: user.persona_language,
  });
  const chatId = crypto.randomUUID();
  const title = prompt.length > 58 ? `${prompt.slice(0, 56)}…` : prompt;

  await exec("insert into chats (id, user_id, title, mode) values ($1,$2,$3,'chat')", [chatId, user.id, title]);
  await exec("insert into chat_messages (id, chat_id, role, content, attachment) values ($1,$2,'user',$3,$4)", [
    crypto.randomUUID(),
    chatId,
    prompt,
    text(form, "attachment") || null,
  ]);
  await exec("insert into chat_messages (id, chat_id, role, content) values ($1,$2,'assistant',$3)", [
    crypto.randomUUID(),
    chatId,
    reply.content,
  ]);
  await logUsage(user.id, "chat");
  await awardXp(user.id, "chat", 5, "Rozmowa z AI");
  await touchStreak(user.id);
  revalidatePath("/chat");
  redirect(`/chat?c=${chatId}`);
}

export async function sendChatMessageAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const chatId = text(form, "chat_id");
  const message = text(form, "message");
  if (!chatId || !message) return;
  const chat = await one<{ id: string; title: string }>("select id, title from chats where id = $1 and user_id = $2", [
    chatId,
    user.id,
  ]);
  if (!chat) redirect("/chat");

  const used = await usageCount(user.id, "chat", 1);
  const plan = PLANS[(user.plan as keyof typeof PLANS) ?? "free"] ?? PLANS.free;
  if (used >= plan.chatsPerDay) redirect("/pricing?limit=chat");

  const history = await q<{ role: string; content: string }>(
    "select role, content from chat_messages where chat_id = $1 order by created_at asc limit 20",
    [chatId],
  );
  const reply = await tutorReply(
    message,
    {
      vibe: user.persona_vibe,
      warmth: user.persona_warmth,
      emojis: user.persona_emojis,
      language: user.persona_language,
    },
    history,
  );

  await exec("insert into chat_messages (id, chat_id, role, content, attachment) values ($1,$2,'user',$3,$4)", [
    crypto.randomUUID(),
    chatId,
    message,
    text(form, "attachment") || null,
  ]);
  await exec("insert into chat_messages (id, chat_id, role, content) values ($1,$2,'assistant',$3)", [
    crypto.randomUUID(),
    chatId,
    reply.content,
  ]);
  await exec("update chats set updated_at = now() where id = $1", [chatId]);
  if (history.length <= 1) {
    const title = message.length > 58 ? `${message.slice(0, 56)}…` : message;
    await exec("update chats set title = $2 where id = $1", [chatId, title]);
  }
  await logUsage(user.id, "chat");
  await touchStreak(user.id);
  revalidatePath("/chat");
}

export async function deleteChatAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const chatId = text(form, "chat_id");
  await exec("delete from chats where id = $1 and user_id = $2", [chatId, user.id]);
  revalidatePath("/chat");
  redirect("/chat");
}

export async function drawFromChatAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const prompt = text(form, "prompt");
  if (!prompt) redirect("/whiteboard");

  const remaining = await whiteboardRemaining(user);
  if (!remaining.unlimited && remaining.left <= 0) redirect("/pricing?limit=whiteboard");

  const lesson = await generateLesson(prompt);
  const id = crypto.randomUUID();
  await exec(
    `insert into boards (id, user_id, title, prompt, subject_slug, lesson)
     values ($1,$2,$3,$4,$5,$6::jsonb)`,
    [id, user.id, lesson.title, lesson.prompt, lesson.subject, JSON.stringify(lesson)],
  );
  await logUsage(user.id, "whiteboard");
  await awardXp(user.id, "lesson", 40, `Lekcja: ${lesson.title}`);
  await touchStreak(user.id);
  revalidatePath("/whiteboard");
  redirect(`/whiteboard/${id}`);
}

/* --------------------------- whiteboard --------------------------- */

export async function createBoardAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const prompt = text(form, "prompt");
  if (!prompt) redirect("/whiteboard");

  const remaining = await whiteboardRemaining(user);
  if (!remaining.unlimited && remaining.left <= 0) redirect("/pricing?limit=whiteboard");

  const lesson = await generateLesson(prompt);
  const id = crypto.randomUUID();
  await exec(
    `insert into boards (id, user_id, title, prompt, subject_slug, lesson)
     values ($1,$2,$3,$4,$5,$6::jsonb)`,
    [id, user.id, lesson.title, lesson.prompt, lesson.subject, JSON.stringify(lesson)],
  );
  await logUsage(user.id, "whiteboard");
  await awardXp(user.id, "lesson", 40, `Lekcja: ${lesson.title}`);
  await touchStreak(user.id);
  await notify(user.id, "system", `Nowa lekcja na tablicy: ${lesson.title}`, `/whiteboard/${id}`);
  revalidatePath("/whiteboard");
  redirect(`/whiteboard/${id}`);
}

export async function followUpBoardAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const boardId = text(form, "board_id");
  const question = text(form, "question");
  if (!boardId || !question) return;
  const board = await one<{ lesson: unknown; title: string }>(
    "select lesson, title from boards where id = $1 and user_id = $2",
    [boardId, user.id],
  );
  if (!board) redirect("/whiteboard");
  const lesson = (typeof board.lesson === "string" ? JSON.parse(board.lesson) : board.lesson) as Lesson;
  const expanded = await extendLesson(lesson, question);
  const added = Math.max(1, expanded.steps.length - lesson.steps.length);
  await exec("update boards set lesson = $2::jsonb, updated_at = now() where id = $1", [
    boardId,
    JSON.stringify(expanded),
  ]);
  await exec("insert into board_messages (id, board_id, role, content) values ($1,$2,'user',$3)", [
    crypto.randomUUID(),
    boardId,
    question,
  ]);
  await exec("insert into board_messages (id, board_id, role, content) values ($1,$2,'assistant',$3)", [
    crypto.randomUUID(),
    boardId,
    `Dopisałem ${added} ${plural(added, "krok", "kroki", "kroków")} na tablicy. Przewiń do końca, żeby zobaczyć doprecyzowanie.`,
  ]);
  await awardXp(user.id, "lesson", 10, "Dopytanie na tablicy");
  revalidatePath(`/whiteboard/${boardId}`);
  redirect(`/whiteboard/${boardId}?step=${expanded.steps.length - 2}`);
}

export async function deleteBoardAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "board_id");
  await exec("delete from boards where id = $1 and user_id = $2", [id, user.id]);
  revalidatePath("/whiteboard");
  redirect("/whiteboard");
}

export async function togglePinBoardAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "board_id");
  await exec("update boards set pinned = not pinned where id = $1 and user_id = $2", [id, user.id]);
  revalidatePath("/whiteboard");
}

/* ------------------------------ plans ----------------------------- */

export async function addPlanItemAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const title = text(form, "title");
  const due = text(form, "due_date");
  if (!title || !due) return;
  await exec(
    `insert into plan_items (id, user_id, title, subject_slug, kind, due_date, estimate_min, notes)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      crypto.randomUUID(),
      user.id,
      title,
      text(form, "subject") || null,
      text(form, "kind") || "task",
      due,
      Number(text(form, "estimate")) || 30,
      text(form, "notes"),
    ],
  );
  await touchStreak(user.id);
  revalidatePath("/plans");
}

export async function togglePlanItemAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "item_id");
  const row = await one<{ done: boolean; title: string }>(
    "update plan_items set done = not done where id = $1 and user_id = $2 returning done, title",
    [id, user.id],
  );
  if (row?.done) {
    await awardXp(user.id, "plan", 15, `Zadanie: ${row.title}`);
    await touchStreak(user.id);
  }
  revalidatePath("/plans");
  revalidatePath("/home");
}

export async function deletePlanItemAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await exec("delete from plan_items where id = $1 and user_id = $2", [text(form, "item_id"), user.id]);
  revalidatePath("/plans");
}

export async function generatePlanAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const subject = text(form, "subject");
  const exam = text(form, "exam_date");
  const title = text(form, "title") || "Powtórka";
  if (!exam) return;
  const topic = TOPICS.find((t) => t.subject === subject);
  const examDate = new Date(exam);
  const today = new Date();
  const days = Math.max(1, Math.round((examDate.getTime() - today.getTime()) / 86400000));
  const steps = Math.min(4, Math.max(2, Math.ceil(days / 3)));
  const topicsList = topic ? topic.build(topic.title).takeaways.slice(0, steps) : [];

  for (let i = 0; i < steps; i += 1) {
    const offset = Math.max(0, Math.round((days / steps) * i));
    const due = new Date(today.getTime() + offset * 86400000);
    const iso = due.toISOString().slice(0, 10);
    await exec(
      `insert into plan_items (id, user_id, title, subject_slug, kind, due_date, estimate_min, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        crypto.randomUUID(),
        user.id,
        i === steps - 1 ? `${title}: ostatnia powtórka` : `${title}: etap ${i + 1}`,
        subject || null,
        "task",
        iso,
        30,
        topicsList[i] ?? "Aktywna powtórka: wyjaśnij temat na głos bez notatek.",
      ],
    );
  }
  await exec(
    `insert into plan_items (id, user_id, title, subject_slug, kind, due_date, estimate_min, notes)
     values ($1,$2,$3,$4,'exam',$5,60,$6)`,
    [crypto.randomUUID(), user.id, title, subject || null, exam, "Egzamin — dzień docelowy"],
  );
  await touchStreak(user.id);
  revalidatePath("/plans");
}

export async function saveRecallAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const topic = text(form, "topic");
  const transcript = text(form, "transcript");
  const score = Math.min(100, Math.max(0, Number(text(form, "score")) || 0));
  if (!topic) return;
  const words = transcript.split(/\s+/).filter(Boolean).length;
  const feedback =
    words < 30
      ? "Bardzo krótka wypowiedź. Spróbuj wyjaśnić temat w 3–4 zdaniach, używając pojęć z lekcji."
      : score >= 70
        ? "Dobra robota — mówisz płynnie i używasz właściwych pojęć. Powtórz to za 3 dni."
        : "Warto wrócić do definicji i jednego przykładu. Nagraj się ponownie po krótkiej powtórce.";
  await exec(
    "insert into recall_sessions (id, user_id, topic, score, feedback) values ($1,$2,$3,$4,$5)",
    [crypto.randomUUID(), user.id, topic, score, feedback],
  );
  if (words >= 40) await awardXp(user.id, "recall", 25, `Voice Recall: ${topic}`);
  await touchStreak(user.id);
  revalidatePath("/plans");
}

/* ---------------------------- practice ---------------------------- */

export async function createQuizAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const topicName = text(form, "topic") || text(form, "custom") || "funkcja kwadratowa";
  const topic = detectTopic(topicName) ?? topicByKey("quadratic");
  const aiQuestions = await generateQuiz(topicName);
  const questions = aiQuestions ?? buildQuiz(topic, 5);
  const title = aiQuestions
    ? `${topicName.charAt(0).toUpperCase()}${topicName.slice(1)} — quiz`
    : `${topic.title} — quiz`;
  const id = crypto.randomUUID();
  await exec(
    `insert into quizzes (id, user_id, title, subject_slug, topic, questions)
     values ($1,$2,$3,$4,$5,$6::jsonb)`,
    [id, user.id, title, topic.subject, topic.key, JSON.stringify(questions)],
  );
  await touchStreak(user.id);
  revalidatePath("/practice");
  redirect(`/practice/quiz/${id}`);
}

export async function createMockExamAction(): Promise<void> {
  const user = await requireUser();
  const mixed = ["quadratic", "kinematics", "photosynthesis", "atom", "probability"]
    .map((key) => buildQuiz(topicByKey(key), 2))
    .flat();
  const id = crypto.randomUUID();
  await exec(
    `insert into quizzes (id, user_id, title, subject_slug, topic, questions)
     values ($1,$2,$3,$4,$5,$6::jsonb)`,
    [id, user.id, "Egzamin próbny — 10 mieszanych pytań", "inne", "mock", JSON.stringify(mixed)],
  );
  await touchStreak(user.id);
  redirect(`/practice/quiz/${id}`);
}

export async function submitQuizAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const quizId = text(form, "quiz_id");
  const quiz = await one<{ questions: unknown; title: string }>(
    "select questions, title from quizzes where id = $1 and user_id = $2",
    [quizId, user.id],
  );
  if (!quiz) redirect("/practice");
  const questions = (typeof quiz.questions === "string" ? JSON.parse(quiz.questions) : quiz.questions) as Array<{
    answer: number;
  }>;
  const answers: number[] = questions.map((_, i) => {
    const raw = form.get(`q${i}`);
    return raw == null ? -1 : Number(raw);
  });
  const score = answers.reduce((sum, a, i) => (a === questions[i].answer ? sum + 1 : sum), 0);
  const attemptId = crypto.randomUUID();
  await exec(
    `insert into quiz_attempts (id, quiz_id, user_id, score, total, answers)
     values ($1,$2,$3,$4,$5,$6::jsonb)`,
    [attemptId, quizId, user.id, score, questions.length, JSON.stringify(answers)],
  );
  if (score > 0) await awardXp(user.id, "quiz", score * 12, `Quiz: ${quiz.title}`);
  await touchStreak(user.id);
  redirect(`/practice/quiz/${quizId}?attempt=${attemptId}`);
}

export async function createFlashcardSetAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const topicName = text(form, "topic") || "fotosynteza";
  const topic = detectTopic(topicName) ?? topicByKey("photosynthesis");
  const cards = buildFlashcards(topic);
  if (!cards.length) return;
  const id = crypto.randomUUID();
  await exec("insert into flashcard_sets (id, user_id, title, subject_slug) values ($1,$2,$3,$4)", [
    id,
    user.id,
    `${topic.title} — fiszki`,
    topic.subject,
  ]);
  for (const card of cards) {
    await exec("insert into flashcards (id, set_id, front, back) values ($1,$2,$3,$4)", [
      crypto.randomUUID(),
      id,
      card.front,
      card.back,
    ]);
  }
  await touchStreak(user.id);
  redirect(`/practice/flashcards/${id}`);
}

export async function reviewCardAction(form: FormData): Promise<void> {
  await requireUser();
  const cardId = text(form, "card_id");
  const known = text(form, "known") === "1";
  const card = await one<{ box: number }>("select box from flashcards where id = $1", [cardId]);
  if (!card) return;
  const box = known ? Math.min(5, card.box + 1) : 1;
  const days = [0, 1, 2, 4, 7, 14][box] ?? 1;
  await exec("update flashcards set box = $2, due_at = now() + ($3 || ' days')::interval where id = $1", [
    cardId,
    box,
    String(days),
  ]);
  const setId = text(form, "set_id");
  if (setId) revalidatePath(`/practice/flashcards/${setId}`);
}

export async function deleteQuizAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await exec("delete from quizzes where id = $1 and user_id = $2", [text(form, "quiz_id"), user.id]);
  revalidatePath("/practice");
}

/* ----------------------------- library ---------------------------- */

export async function createFolderAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const name = text(form, "name");
  if (!name) return;
  await exec("insert into folders (id, user_id, name) values ($1,$2,$3)", [crypto.randomUUID(), user.id, name]);
  revalidatePath("/library");
}

export async function deleteFolderAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await exec("delete from folders where id = $1 and user_id = $2", [text(form, "folder_id"), user.id]);
  revalidatePath("/library");
}

export async function uploadAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > 8 * 1024 * 1024) redirect("/library?error=size");

  const isText = /^(text\/|application\/(json|xml))/.test(file.type) || /\.(txt|md|csv|json)$/i.test(file.name);
  const content = isText ? (await file.text()).slice(0, 60000) : "";
  const summary = content
    ? await summarizeUpload(content)
    : "To plik, którego nie potrafimy odczytać lokalnie (np. PDF lub zdjęcie). Dodaj krótki opis albo wklej tekst, żeby AI mogło streścić materiał.";
  const subject = detectTopic(content || file.name)?.subject ?? null;

  await exec(
    `insert into uploads (id, user_id, folder_id, filename, mime, bytes, content, summary, subject_slug)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      crypto.randomUUID(),
      user.id,
      text(form, "folder_id") || null,
      file.name,
      file.type || "application/octet-stream",
      file.size,
      content,
      summary,
      subject,
    ],
  );
  await awardXp(user.id, "upload", 15, `Materiał: ${file.name}`);
  await touchStreak(user.id);
  revalidatePath("/library");
}

export async function updateUploadSummaryAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "upload_id");
  const summary = text(form, "summary");
  await exec("update uploads set summary = $2 where id = $1 and user_id = $3", [id, summary, user.id]);
  revalidatePath("/library");
}

export async function deleteUploadAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await exec("delete from uploads where id = $1 and user_id = $2", [text(form, "upload_id"), user.id]);
  revalidatePath("/library");
}

/* ---------------------------- community --------------------------- */

export async function createNoteAction(_prev: FormState | undefined, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const title = text(form, "title");
  const body = text(form, "body");
  const subject = text(form, "subject");
  if (title.length < 8) return { error: "Tytuł musi mieć co najmniej 8 znaków." };
  if (body.length < 120) return { error: "Notatka powinna mieć co najmniej 120 znaków." };

  let slug = slugify(title);
  const existing = await one<{ id: string }>("select id from notes where slug = $1", [slug]);
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const tags = text(form, "tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);

  await exec(
    `insert into notes (id, author_id, title, slug, subject_slug, body, tags, read_minutes)
     values ($1,$2,$3,$4,$5,$6,$7::text[],$8)`,
    [
      crypto.randomUUID(),
      user.id,
      title,
      slug,
      subject || null,
      body,
      `{${tags.map((t) => `"${t.replace(/"/g, "")}"`).join(",")}}`,
      readingTime(body),
    ],
  );
  await awardXp(user.id, "note", 50, `Notatka: ${title}`);
  await touchStreak(user.id);
  revalidatePath("/community");
  redirect(`/notes/${slug}`);
}

export async function toggleNoteLikeAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const noteId = text(form, "note_id");
  const existing = await one<{ user_id: string }>(
    "select user_id from note_likes where user_id = $1 and note_id = $2",
    [user.id, noteId],
  );
  if (existing) {
    await exec("delete from note_likes where user_id = $1 and note_id = $2", [user.id, noteId]);
  } else {
    await exec("insert into note_likes (user_id, note_id) values ($1,$2)", [user.id, noteId]);
    const note = await one<{ author_id: string; title: string; slug: string }>(
      "select author_id, title, slug from notes where id = $1",
      [noteId],
    );
    if (note && note.author_id !== user.id) {
      await notify(note.author_id, "like", `${user.display_name} polubił twoją notatkę: ${note.title}`, `/notes/${note.slug}`);
    }
  }
  revalidatePath("/community");
  const slug = text(form, "slug");
  if (slug) revalidatePath(`/notes/${slug}`);
}

export async function toggleNoteSaveAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const noteId = text(form, "note_id");
  const existing = await one<{ user_id: string }>(
    "select user_id from note_saves where user_id = $1 and note_id = $2",
    [user.id, noteId],
  );
  if (existing) {
    await exec("delete from note_saves where user_id = $1 and note_id = $2", [user.id, noteId]);
  } else {
    await exec("insert into note_saves (user_id, note_id) values ($1,$2)", [user.id, noteId]);
  }
  revalidatePath("/community");
  revalidatePath("/library");
  const slug = text(form, "slug");
  if (slug) revalidatePath(`/notes/${slug}`);
}

export async function addNoteCommentAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const noteId = text(form, "note_id");
  const body = text(form, "body");
  if (!noteId || !body) return;
  await exec("insert into note_comments (id, note_id, author_id, body) values ($1,$2,$3,$4)", [
    crypto.randomUUID(),
    noteId,
    user.id,
    body,
  ]);
  const note = await one<{ author_id: string; title: string; slug: string }>(
    "select author_id, title, slug from notes where id = $1",
    [noteId],
  );
  if (note && note.author_id !== user.id) {
    await notify(note.author_id, "comment", `${user.display_name} skomentował: ${note.title}`, `/notes/${note.slug}`);
  }
  await awardXp(user.id, "comment", 5, "Komentarz");
  const slug = text(form, "slug");
  if (slug) revalidatePath(`/notes/${slug}`);
}

export async function askQuestionAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const title = text(form, "title");
  if (title.length < 10) return;
  await exec(
    "insert into questions (id, author_id, title, body, subject_slug) values ($1,$2,$3,$4,$5)",
    [crypto.randomUUID(), user.id, title, text(form, "body"), text(form, "subject") || null],
  );
  await awardXp(user.id, "question", 10, "Pytanie do społeczności");
  await touchStreak(user.id);
  revalidatePath("/questions");
}

export async function answerQuestionAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const questionId = text(form, "question_id");
  const body = text(form, "body");
  if (!questionId || body.length < 10) return;
  await exec("insert into answers (id, question_id, author_id, body) values ($1,$2,$3,$4)", [
    crypto.randomUUID(),
    questionId,
    user.id,
    body,
  ]);
  const question = await one<{ author_id: string; title: string }>(
    "select author_id, title from questions where id = $1",
    [questionId],
  );
  if (question && question.author_id !== user.id) {
    await notify(question.author_id, "answer", `${user.display_name} odpowiedział na twoje pytanie.`, "/questions");
  }
  await awardXp(user.id, "answer", 20, "Odpowiedź");
  revalidatePath("/questions");
}

export async function voteAnswerAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const answerId = text(form, "answer_id");
  const value = Number(text(form, "value")) || 1;
  const answer = await one<{ author_id: string }>("select author_id from answers where id = $1", [answerId]);
  if (!answer) return;
  await exec("update answers set votes = votes + $2 where id = $1", [answerId, value]);
  if (answer.author_id !== user.id) {
    await awardXp(answer.author_id, "helpful", value > 0 ? 10 : -5, "Głos na odpowiedź");
  }
  revalidatePath("/questions");
}

export async function acceptAnswerAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const answerId = text(form, "answer_id");
  const answer = await one<{ question_id: string; author_id: string }>(
    `select a.question_id, a.author_id from answers a
     join questions q on q.id = a.question_id
     where a.id = $1 and q.author_id = $2`,
    [answerId, user.id],
  );
  if (!answer) return;
  await exec("update answers set accepted = false where question_id = $1", [answer.question_id]);
  await exec("update answers set accepted = true, votes = votes + 5 where id = $1", [answerId]);
  await exec("update questions set resolved = true where id = $1", [answer.question_id]);
  if (answer.author_id !== user.id) {
    await awardXp(answer.author_id, "accepted", 40, "Zaakceptowana odpowiedź");
    await notify(answer.author_id, "accepted", "Twoja odpowiedź została zaakceptowana! +40 XP", "/questions");
  }
  revalidatePath("/questions");
}

export async function reportAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const targetKind = text(form, "target_kind");
  const targetId = text(form, "target_id");
  const reason = text(form, "reason");
  if (!targetKind || !targetId || !reason) return;
  await exec(
    "insert into reports (id, reporter_id, target_kind, target_id, reason) values ($1,$2,$3,$4,$5)",
    [crypto.randomUUID(), user.id, targetKind, targetId, reason],
  );
  revalidatePath("/community");
}

export async function deleteNoteAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await exec("delete from notes where id = $1 and author_id = $2", [text(form, "note_id"), user.id]);
  revalidatePath("/community");
  redirect("/community");
}

/* ---------------------------- settings ---------------------------- */

export async function updateProfileAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await exec(
    `update profiles set display_name = $2, bio = $3, school = $4, grade = $5, avatar_hue = $6
     where id = $1`,
    [
      user.id,
      text(form, "display_name") || user.display_name,
      text(form, "bio"),
      text(form, "school"),
      text(form, "grade"),
      Math.min(359, Math.max(0, Number(text(form, "avatar_hue")) || user.avatar_hue)),
    ],
  );
  revalidatePath("/settings");
  revalidatePath("/home");
}

export async function updatePersonaAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await exec(
    `update profiles set persona_vibe = $2, persona_warmth = $3, persona_emojis = $4, persona_language = $5
     where id = $1`,
    [
      user.id,
      text(form, "vibe") || "friend",
      Math.min(5, Math.max(1, Number(text(form, "warmth")) || 3)),
      Math.min(3, Math.max(0, Number(text(form, "emojis")) || 0)),
      text(form, "language") || "pl",
    ],
  );
  revalidatePath("/settings");
}

export async function changePlanAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const plan = text(form, "plan");
  if (!["free", "pro", "max"].includes(plan)) return;
  await exec("update profiles set plan = $2 where id = $1", [user.id, plan]);
  await notify(user.id, "system", `Twój plan to teraz ${PLANS[plan as keyof typeof PLANS].label}.`, "/pricing");
  revalidatePath("/pricing");
  revalidatePath("/settings");
  revalidatePath("/whiteboard");
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  await exec("update notifications set read = true where user_id = $1", [user.id]);
  revalidatePath("/home");
}
