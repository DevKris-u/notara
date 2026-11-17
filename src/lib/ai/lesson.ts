import { expandLesson, planLesson } from "../lesson";
import { bullet, makeLesson, scene, title } from "../lesson/geometry";
import { SUBJECTS } from "../lesson/topics";
import { INK, type Lesson, type Op, type Step } from "../lesson/types";
import { aiEnabled, aiJson } from "./llm";

type AiStep = {
  title: string;
  narration: string;
  bullets: string[];
  formula?: string;
  note?: string;
};

type AiLesson = {
  title: string;
  subtitle: string;
  subject: string;
  emoji: string;
  steps: AiStep[];
  takeaways: string[];
  followUps: string[];
};

const PALETTE = [INK.gold, INK.mint, INK.lilac, INK.sky, INK.coral, INK.green];

const STEP_SCHEMA = `{
  "title": "krótki tytuł kroku (max 46 znaków)",
  "narration": "2–4 zdania wypowiadane na głos, po polsku, bez formatowania i bez emoji, 45–90 słów",
  "bullets": ["2–4 bardzo krótkie punkty do narysowania (max 85 znaków każdy)"],
  "formula": "opcjonalny wzór lub kluczowa zależność, np. y = a·x + b (bez LaTeX-a)",
  "note": "opcjonalna rada albo typowy błąd (max 120 znaków)"
}`;

const LESSON_SYSTEM = [
  "Jesteś autorem lekcji dla polskiej aplikacji edukacyjnej Notara. Tworzysz materiał, który asystent rysuje na tablicy i czyta na głos.",
  "",
  "Zasady:",
  "- Wszystko po polsku, poprawną polszczyzną, bez anglicyzmów, jeśli istnieje polski termin.",
  "- Poziom: uczeń liceum lub student pierwszego roku.",
  "- Każdy krok to jedna myśl. Kolejność: intuicja → definicja → przykład → zastosowanie → sprawdzenie.",
  "- narration jest czytane na głos: pisz pełnymi zdaniami, bez Markdownu, bez wzorów zapisanych znakami specjalnymi (zamiast √ napisz pierwiastek).",
  "- bullets są rysowane: maksymalnie 85 znaków, bez kropki na końcu, mogą zawierać prosty wzór.",
  "- Nie wymyślaj danych, których nie znasz. Jeśli temat jest niejasny, przyjmij najbardziej prawdopodobną interpretację i zaznacz to w pierwszym kroku.",
  "- Zero treści obraźliwych, zero porad medycznych lub prawnych.",
  "",
  `Struktura kroku:\n${STEP_SCHEMA}`,
  "",
  "Zwróć WYŁĄCZNIE JSON:",
  `{
  "title": "tytuł lekcji (max 60 znaków)",
  "subtitle": "jedno zdanie podtytułu (max 110 znaków)",
  "subject": "matematyka | fizyka | chemia | biologia | polski | historia | angielski | inne",
  "emoji": "jedno emoji pasujące do tematu",
  "steps": [ 4–6 kroków według schematu ],
  "takeaways": ["3–5 zdań: co trzeba zapamiętać"],
  "followUps": ["3 naturalne pytania, które uczeń mógłby zadać dalej"]
}`,
].join("\n");

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function validateStep(value: unknown): AiStep | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const title = str(record.title, 60);
  const narration = str(record.narration, 1200);
  const bullets = (Array.isArray(record.bullets) ? record.bullets : [])
    .map((item) => str(item, 120))
    .filter(Boolean)
    .slice(0, 4);
  if (!title || narration.length < 60 || !bullets.length) return null;
  return {
    title,
    narration,
    bullets,
    formula: str(record.formula, 90) || undefined,
    note: str(record.note, 140) || undefined,
  };
}

function validateLesson(value: unknown): AiLesson | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const title = str(record.title, 70);
  if (!title) return null;

  const steps = (Array.isArray(record.steps) ? record.steps : [])
    .map(validateStep)
    .filter((step): step is AiStep => Boolean(step))
    .slice(0, 6);
  if (steps.length < 3) return null;

  const rawSubject = str(record.subject, 20).toLowerCase();
  const subject = rawSubject in SUBJECTS ? rawSubject : "inne";

  return {
    title,
    subtitle: str(record.subtitle, 160) || "Lekcja krok po kroku",
    subject,
    emoji: str(record.emoji, 8) || SUBJECTS[subject as keyof typeof SUBJECTS].emoji,
    steps,
    takeaways: (Array.isArray(record.takeaways) ? record.takeaways : [])
      .map((item) => str(item, 160))
      .filter(Boolean)
      .slice(0, 5),
    followUps: (Array.isArray(record.followUps) ? record.followUps : [])
      .map((item) => str(item, 120))
      .filter(Boolean)
      .slice(0, 4),
  };
}

/** Turns AI-written content into canvas operations. The model never controls geometry. */
function renderStep(step: AiStep, index: number): Step {
  const box = scene(index);
  const color = PALETTE[index % PALETTE.length];
  const ops: Op[] = [title(40, 44, step.title, color)];

  let top = 130;
  if (step.formula) {
    ops.push({ k: "highlight", x: 34, y: 98, w: 742, h: 86, color: "#f7e7a8" });
    ops.push({
      k: "text",
      x: 60,
      y: 156,
      text: step.formula,
      size: 30,
      hand: true,
      color: INK.ink,
      maxW: 700,
      at: 0.06,
    });
    top = 222;
  }

  const bullets = step.bullets.slice(0, 4);
  bullets.forEach((text, i) => {
    ops.push(...bullet(66, top + i * 62, text, i, color));
  });

  const bottom = top + bullets.length * 62 + 8;
  if (step.note && bottom < 520) {
    ops.push({
      k: "rect",
      x: 40,
      y: bottom + 12,
      w: 726,
      h: 102,
      radius: 18,
      color,
      width: 2,
      fill: "#fffaf0",
    });
    ops.push({
      k: "text",
      x: 62,
      y: bottom + 46,
      text: "Zapamiętaj",
      size: 19,
      weight: 700,
      color: INK.coral,
    });
    ops.push({
      k: "text",
      x: 62,
      y: bottom + 78,
      text: step.note,
      size: 18,
      maxW: 676,
      color: INK.soft,
    });
  }

  return box.step(step.title, step.narration, ops);
}

function speechNarration(narration: string): string {
  return narration
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** AI lesson; falls back to the authored topic library when the model is unavailable. */
export async function generateLesson(prompt: string): Promise<Lesson> {
  const fallback = planLesson(prompt);
  if (!aiEnabled()) return fallback;

  const ai = await aiJson(
    {
      system: LESSON_SYSTEM,
      user: `Temat lekcji: ${prompt}`,
      maxTokens: 4000,
      temperature: 0.55,
      json: true,
    },
    validateLesson,
  );
  if (!ai) return fallback;

  const steps = ai.steps.map((step, index) => {
    const rendered = renderStep({ ...step, narration: speechNarration(step.narration) }, index);
    return rendered;
  });

  return makeLesson({
    title: ai.title,
    subtitle: ai.subtitle,
    subject: ai.subject,
    subjectName: SUBJECTS[ai.subject as keyof typeof SUBJECTS]?.name ?? "Nauka własna",
    emoji: ai.emoji,
    prompt,
    steps,
    followUps: ai.followUps.length
      ? ai.followUps
      : ["Wyjaśnij to prostszymi słowami", "Pokaż przykład z życia", "Jakie zadanie to sprawdza?"],
    takeaways: ai.takeaways.length ? ai.takeaways : ai.steps.map((step) => step.title),
  });
}

const FOLLOW_UP_SYSTEM = [
  "Jesteś autorem lekcji w aplikacji Notara. Uczeń ogląda już tablicę i zadaje dodatkowe pytanie.",
  "Dopisz 2 nowe kroki, które precyzyjnie odpowiadają na pytanie i pasują do reszty lekcji.",
  "Nie powtarzaj tego, co już jest na tablicy. Każdy krok: jedno konkretne uzupełnienie lub kontrprzykład.",
  "Po polsku, narration bez formatowania (czytane na głos), bullets krótkie.",
  "",
  `Schemat kroku:\n${STEP_SCHEMA}`,
  "",
  'Zwróć WYŁĄCZNIE JSON: {"steps": [krok, krok]}',
].join("\n");

function validateSteps(value: unknown): { steps: AiStep[] } | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const steps = (Array.isArray(record.steps) ? record.steps : [])
    .map(validateStep)
    .filter((step): step is AiStep => Boolean(step))
    .slice(0, 3);
  return steps.length ? { steps } : null;
}

/** Adds 2 AI-written steps to an existing board, keeping all previous drawing. */
export async function extendLesson(lesson: Lesson, question: string): Promise<Lesson> {
  if (!aiEnabled()) return expandLesson(lesson, question);

  const outline = lesson.steps.map((step, index) => `${index + 1}. ${step.title}`).join("\n");
  const result = await aiJson(
    {
      system: FOLLOW_UP_SYSTEM,
      user: [
        `Tytuł lekcji: ${lesson.title}`,
        `Podtytuł: ${lesson.subtitle}`,
        `Pytanie ucznia: ${question}`,
        "Kroki już na tablicy:",
        outline,
        "Najważniejsze wnioski lekcji:",
        lesson.takeaways.map((item) => `- ${item}`).join("\n"),
      ].join("\n"),
      maxTokens: 2500,
      temperature: 0.55,
      json: true,
    },
    validateSteps,
  );
  if (!result) return expandLesson(lesson, question);

  const offset = lesson.steps.length;
  const added = result.steps.map((step, index) =>
    renderStep({ ...step, narration: speechNarration(step.narration) }, offset + index),
  );
  const steps = [...lesson.steps, ...added];
  return {
    ...lesson,
    steps,
    durationMs: steps.reduce((sum, step) => sum + step.durMs, 0),
  };
}
