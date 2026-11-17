import { chatReply, type ChatReply, type Persona } from "./local";
import { aiEnabled, aiJson } from "./llm";

export type ChatTurn = { role: string; content: string };

export type TutorResult = ChatReply & { engine: "nvidia" | "local" };

const VIBE_HINT: Record<string, string> = {
  friend: "mów jak życzliwy kolega z klasy, który już to ogarnął — bez szkolnego tonu",
  teacher:
    "mów jak dobry nauczyciel: najpierw definicja, potem przykład, na końcu typowy błąd uczniów",
  coach: "mów jak coach: krótko, konkretnie, w krokach do wykonania, z jednym zadaniem na teraz",
};

const QUICK = /^(hej|cześć|czesc|siema|hello|hi|yo|dzień dobry|dzien dobry|dobry wieczór|dzięk|dziek|thanks|thx)\b/i;

function systemPrompt(persona: Persona): string {
  const emojiRule =
    persona.emojis <= 0
      ? "Nie używaj emoji."
      : persona.emojis === 1
        ? "Użyj co najwyżej jednego emoji w całej odpowiedzi."
        : "Możesz użyć 1–2 emoji, ale nie w każdym zdaniu.";

  return [
    "Jesteś Notara — asystentem AI do nauki dla polskich uczniów i studentów.",
    `Styl odpowiedzi: ${VIBE_HINT[persona.vibe] ?? VIBE_HINT.friend}.`,
    `Ciepło: ${persona.warmth}/5 (${persona.warmth >= 4 ? "dużo zachęty i wsparcia" : "rzeczowo, bez zbędnych ozdobników"}).`,
    emojiRule,
    "",
    "Zasady merytoryczne:",
    "- Odpowiadaj po polsku, chyba że użytkownik pisze po angielsku.",
    "- Tłumacz krok po kroku. Podaj definicję, konkretny przykład i — jeśli pasuje — typowy błąd.",
    "- Nie zmyślaj wzorów, liczb ani źródeł. Jeśli nie jesteś pewien, powiedz to wprost.",
    "- Nie rozwiązuj zadań domowych za ucznia: pokaż metodę i pierwszy krok, potem poproś o próbę.",
    "- Przy tematach zdrowotnych lub prawnych zaznacz, że to materiał edukacyjny, nie porada specjalisty.",
    "",
    "Format: 120–220 słów, maksymalnie 3 sekcje, Markdown (pogrubienia, listy, `wzory`).",
    "Jeśli pytanie jest wieloznaczne, zadaj jedno krótkie pytanie doprecyzowujące na końcu.",
    "",
    'Zwróć WYŁĄCZNIE poprawny JSON: {"reply": "odpowiedź w Markdown", "suggestions": ["krótkie pytanie", "krótkie pytanie", "krótkie pytanie"]}.',
    "suggestions: 2–3 naturalne, krótkie pytania uzupełniające po polsku (maks. 8 słów każde). Bez numeracji.",
  ].join("\n");
}

type TutorPayload = { content: string; suggestions: string[] };

function asString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validateTutor(value: unknown): TutorPayload | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const content = asString(record.reply ?? record.content, 8000);
  if (content.length < 20) return null;
  const rawSuggestions = Array.isArray(record.suggestions) ? record.suggestions : [];
  const suggestions = rawSuggestions
    .map((item) => asString(item, 90))
    .filter((item) => item.length > 3)
    .slice(0, 3);
  return { content, suggestions };
}

/**
 * Persona-aware answer: NVIDIA NIM when configured, deterministic local engine otherwise.
 * Short greetings skip the network to keep the chat instant.
 */
export async function tutorReply(
  prompt: string,
  persona: Persona,
  history: ChatTurn[] = [],
): Promise<TutorResult> {
  const fallback = chatReply(prompt, persona, history);
  if (!aiEnabled()) return { ...fallback, engine: "local" };
  if (prompt.trim().length < 40 && QUICK.test(prompt.trim())) return { ...fallback, engine: "local" };

  const turns = history
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-8)
    .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }));

  const result = await aiJson(
    {
      system: systemPrompt(persona),
      user: prompt,
      history: turns,
      maxTokens: 2500,
      temperature: 0.6,
      json: true,
    },
    validateTutor,
  );

  if (!result) return { ...fallback, engine: "local" };

  return {
    content: result.content,
    topic: fallback.topic,
    suggestions: result.suggestions.length >= 2 ? result.suggestions : fallback.suggestions,
    engine: "nvidia",
  };
}

export { chatReply };
export type { ChatReply, Persona };
