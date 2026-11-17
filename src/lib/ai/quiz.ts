import type { QuizQuestion } from "../lesson";
import { aiEnabled, aiJson } from "./llm";

const QUIZ_SYSTEM = [
  "Jesteś autorem testów dla polskiej aplikacji edukacyjnej. Tworzysz pytania sprawdzające zrozumienie, nie pamięć słownikową.",
  "",
  "Zasady:",
  "- 5 pytań, wszystkie po polsku, na poziomie ucznia liceum.",
  "- Dokładnie 4 odpowiedzi, tylko jedna poprawna.",
  "- Dystraktory muszą być wiarygodne (typowe pomyłki), ale jednoznacznie błędne.",
  "- Bez opcji „wszystkie powyższe”, „żadne z powyższych” i bez podpowiedzi w treści.",
  "- explanation: jedno zdanie wyjaśniające, dlaczego poprawna odpowiedź jest poprawna.",
  "- Mieszaj trudność: 2 pytania podstawowe, 2 wymagające zastosowania, 1 podchwytliwe.",
  "",
  'Zwróć WYŁĄCZNIE JSON: {"questions": [{"q": "treść pytania", "options": ["A", "B", "C", "D"], "answer": 0, "explain": "jedno zdanie"}]}.',
  "answer to indeks poprawnej odpowiedzi (0–3).",
].join("\n");

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function validateQuiz(value: unknown): QuizQuestion[] | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const raw = Array.isArray(record.questions) ? record.questions : [];
  const questions: QuizQuestion[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const q = clean(entry.q, 300);
    const explain = clean(entry.explain, 300);
    const options = (Array.isArray(entry.options) ? entry.options : [])
      .map((option) => clean(option, 120))
      .filter(Boolean);
    const answer = Number(entry.answer);
    if (!q || options.length !== 4 || new Set(options.map((o) => o.toLowerCase())).size !== 4) continue;
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) continue;
    if (explain.length < 8) continue;
    questions.push({ q, options, answer, explain });
  }

  return questions.length >= 3 ? questions.slice(0, 6) : null;
}

/** AI-generated multiple-choice quiz, or null so the caller can use the local builder. */
export async function generateQuiz(topic: string): Promise<QuizQuestion[] | null> {
  if (!aiEnabled()) return null;
  return aiJson(
    {
      system: QUIZ_SYSTEM,
      user: `Temat quizu: ${topic}`,
      maxTokens: 3000,
      temperature: 0.55,
      json: true,
    },
    validateQuiz,
  );
}
