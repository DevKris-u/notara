import { bullet, chip, makeLesson, scene, speechMs, translateOp } from "./geometry";
import { INK, type Lesson, type Op } from "./types";
import { GENERIC_TOPIC, SUBJECTS, TOPICS, detectTopic, normalize, type Topic } from "./topics";

export type { Lesson, Step, Op } from "./types";
export { SUBJECTS, TOPICS, detectTopic, topicByKey, normalize } from "./topics";

/** Turns a free-form question into a complete, ready-to-draw whiteboard lesson. */
export function planLesson(prompt: string): Lesson {
  const topic = detectTopic(prompt) ?? GENERIC_TOPIC;
  const built = topic.build(prompt);
  return makeLesson({
    title: topic.title,
    subtitle: topic.subtitle,
    subject: topic.subject,
    subjectName: SUBJECTS[topic.subject].name,
    emoji: topic.emoji,
    prompt,
    steps: built.steps,
    followUps: built.followUps,
    takeaways: built.takeaways,
  });
}

/** Adds a focused follow-up answer to an existing board. */
export function expandLesson(lesson: Lesson, question: string): Lesson {
  const topic = TOPICS.find((t) => t.title === lesson.title) ?? GENERIC_TOPIC;
  const start = lesson.steps.length;
  const qShort = question.length > 110 ? `${question.slice(0, 108)}…` : question;

  const gloss = topic.glossary.slice(0, 4);
  const narration = `Dobre pytanie. Doprecyzujmy to na tablicy. ${qShort.replace(/\?+$/, "")}. ${
    gloss.length
      ? `Najważniejsze pojęcia, które musisz mieć w głowie, to: ${gloss.map(([term]) => term).join(", ")}.`
      : ""
  } Zapisuję to obok, żebyś miał całość w jednym miejscu.`;

  const s0 = scene(start);
  const ops0: Op[] = [
    {
      k: "pill",
      x: 40,
      y: 44,
      w: 760,
      h: 52,
      text: "Doprecyzowanie",
      size: 24,
      bg: "#e2b23f",
      color: "#14211c",
    },
    { k: "text", x: 40, y: 126, text: qShort, size: 22, maxW: 760, color: INK.ink },
    { k: "line", x1: 40, y1: 172, x2: 780, y2: 172, color: "#d8d1bf", width: 2 },
    ...gloss.flatMap(([term, def], i) => [
      {
        k: "text" as const,
        x: 40,
        y: 222 + i * 82,
        text: `${term} — ${def}`,
        size: 18,
        maxW: 740,
        color: INK.soft,
        at: 0.15 + i * 0.04,
      },
    ]),
  ];
  const step0 = s0.step("Doprecyzowanie", narration, ops0);

  const s1 = scene(start + 1);
  const checks = [
    "Zamknij notatkę i powiedz odpowiedź na głos.",
    "Sprawdź, czy używasz właściwych jednostek i pojęć.",
    "Rozwiąż jeszcze jeden przykład bez podglądania.",
  ];
  const step1 = s1.step(
    "Jak sprawdzić, że rozumiesz",
    "Najszybszy test rozumienia to wyjaśnienie na głos bez notatek. Jeśli potrafisz to zrobić w trzydzieści sekund, to znaczy, że wiesz. Jeśli nie, wróć do konkretnego kroku, a nie do całego tematu. Na koniec rozwiąż jeszcze jeden przykład samodzielnie — to domyka naukę.",
    [
      { k: "pill", x: 40, y: 44, w: 700, h: 52, text: "Sprawdzenie", size: 24, bg: "#0d7a55", color: "#fffdf8" },
      ...checks.flatMap((c, i) => bullet(60, 150 + i * 66, c, i, INK.green)),
      chip(60, 380, "30 sekund na wyjaśnienie", "#efe4c9"),
      {
        k: "text",
        x: 60,
        y: 460,
        text: "Powtórz ten temat za 3 dni — wtedy zostaje w pamięci na dłużej.",
        size: 19,
        maxW: 700,
        color: INK.soft,
      },
    ],
  );

  const steps = [...lesson.steps, step0, step1];
  return {
    ...lesson,
    steps,
    durationMs: steps.reduce((sum, s) => sum + s.durMs, 0),
  };
}

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
  explain: string;
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rotate<T>(arr: T[], by: number): T[] {
  const n = arr.length;
  if (!n) return arr;
  const k = ((by % n) + n) % n;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

/** Builds a deterministic multiple-choice quiz from the topic glossary. */
export function buildQuiz(topic: Topic, count = 5): QuizQuestion[] {
  const entries = topic.glossary;
  if (!entries.length) return [];
  const sameSubject = TOPICS.filter((t) => t.subject === topic.subject && t.key !== topic.key);
  const distractorPool = [
    ...sameSubject.flatMap((t) => t.glossary.map(([term]) => term)),
    ...TOPICS.flatMap((t) => t.glossary.map(([term]) => term)),
    ...GENERIC_TOPIC.glossary.map(([term]) => term),
  ].filter((term, i, arr) => arr.indexOf(term) === i && !entries.some(([t]) => t === term));

  return entries.slice(0, count).map(([term, definition], index) => {
    const seed = hash(term + definitionsKey(entries));
    const distractors = rotate(distractorPool, seed % Math.max(1, distractorPool.length))
      .filter((t) => t !== term)
      .slice(0, 3);
    const options = rotate([term, ...distractors], (seed + index) % 4);
    return {
      q: `Które pojęcie pasuje do opisu: „${definition}”?`,
      options,
      answer: Math.max(0, options.indexOf(term)),
      explain: `${term} — ${definition}`,
    };
  });
}

function definitionsKey(entries: Array<[string, string]>): string {
  return entries.map(([t]) => t).join("|");
}

export function buildFlashcards(topic: Topic) {
  return topic.glossary.map(([front, back]) => ({ front, back }));
}

export function topicForLesson(lesson: Lesson): Topic {
  return TOPICS.find((t) => t.title === lesson.title) ?? GENERIC_TOPIC;
}

/** A short spoken-style answer used by the chat tutor. */
export function explainTopic(topic: Topic, prompt: string): string {
  const lessons = topic.build(prompt);
  const [first, second] = lessons.steps;
  return [
    `**${topic.title}** — ${topic.subtitle}.`,
    "",
    first ? first.narration : "",
    "",
    "**W skrócie**",
    ...lessons.takeaways.map((t) => `- ${t}`),
    "",
    second ? `**Jak to zrobić krok po kroku**\n${second.narration}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Two-line answer for a follow-up inside the chat or on the board. */
export function answerFollowUp(lesson: Lesson, question: string): string {
  const topic = topicForLesson(lesson);
  const q = normalize(question);
  const matched = topic.glossary.filter(([term, def]) =>
    q.split(" ").some((w) => w.length > 4 && normalize(def + " " + term).includes(w)),
  );
  const lines: string[] = [];
  if (matched.length) {
    for (const [term, def] of matched.slice(0, 2)) lines.push(`**${term}** — ${def}`);
  }
  lines.push(
    "",
    `Na tablicy dopisałem dwa kroki, które rozbijają to pytanie na części. ${lesson.takeaways[0] ?? ""}`,
  );
  return lines.join("\n");
}

export function narrationMs(steps: Lesson["steps"]): number {
  return steps.reduce((sum, s) => sum + s.durMs, 0);
}

export { scene, bullet, chip, translateOp, speechMs };
