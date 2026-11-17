import { summarizeText } from "./local";
import { aiEnabled, aiText } from "./llm";

const SUMMARY_SYSTEM = [
  "Streścisz materiały do nauki po polsku.",
  "Zasady:",
  "- 3–4 zdania, maksymalnie 90 słów.",
  "- Zachowaj definicje, liczby, wzory i nazwy własne.",
  "- Bez wstępu typu „ten tekst opisuje” — od razu konkret.",
  "- Jeśli materiał jest niekompletny lub nieczytelny, powiedz to w jednym zdaniu.",
].join("\n");

/** LLM summary of an uploaded text file; local extractive summary as fallback. */
export async function summarizeUpload(text: string): Promise<string> {
  const fallback = summarizeText(text, 4);
  if (!aiEnabled() || text.trim().length < 400) return fallback;

  const answer = await aiText({
    system: SUMMARY_SYSTEM,
    user: text.slice(0, 14000),
    maxTokens: 800,
    temperature: 0.3,
    json: false,
  });

  const clean = answer?.replace(/^["'`]+|["'`]+$/g, "").trim() ?? "";
  if (clean.length < 60) return fallback;
  return clean.slice(0, 1200);
}
