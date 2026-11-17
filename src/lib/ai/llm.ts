/**
 * Minimal server-only client for NVIDIA NIM (OpenAI-compatible API).
 *
 * Nothing here may be imported from a Client Component: the API key lives in
 * process.env and would otherwise end up in the browser bundle.
 *
 * Every call is best-effort. On timeout, quota error or invalid JSON it returns
 * null so callers can fall back to the deterministic local engine.
 */

export type ChatMessage = { role: "user" | "assistant"; content: string };

const BASE_URL = (process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
const MODEL = process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3.5-super-vl-120b-a12b";
const TIMEOUT_MS = Number(process.env.NVIDIA_TIMEOUT_MS ?? 90000);
/** Nemotron writes long hidden reasoning by default; that triples latency in a chat UI. */
const THINKING = process.env.NVIDIA_THINKING === "1";

export function aiEnabled(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

export function aiModel(): string | null {
  return aiEnabled() ? MODEL : null;
}

type CompletionArgs = {
  system: string;
  user: string;
  history?: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
};

type CompletionResult = { content: string; model: string } | null;

async function complete(args: CompletionArgs, attempt = 1, includeThinking = true): Promise<CompletionResult> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return null;

  const messages = [
    { role: "system", content: args.system },
    ...(args.history ?? []).slice(-8).map((message) => ({
      role: message.role,
      content: message.content.slice(0, 4000),
    })),
    { role: "user", content: args.user },
  ];

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: args.temperature ?? 0.5,
    max_tokens: args.maxTokens ?? 1800,
  };
  if (includeThinking) body.chat_template_kwargs = { thinking: THINKING };
  if (args.json) body.response_format = { type: "json_object" };

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      if (response.status === 400 && includeThinking && /chat_template_kwargs/i.test(detail)) {
        return complete(args, attempt, false);
      }
      const retryable = response.status === 429 || response.status === 503 || response.status >= 500;
      if (retryable && attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        return complete(args, 2, includeThinking);
      }
      console.warn(`[ai] ${MODEL} -> HTTP ${response.status}: ${detail}`);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) {
      console.warn(`[ai] ${MODEL} returned empty content`);
      return null;
    }
    return { content, model: MODEL };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[ai] ${MODEL} request failed: ${message}`);
    return null;
  }
}

/** Plain text completion. */
export async function aiText(args: CompletionArgs): Promise<string | null> {
  const result = await complete({ ...args, json: false });
  return result?.content ?? null;
}

/** Pulls the first JSON object/array out of a model answer (tolerates fences and prose). */
export function extractJson(raw: string): unknown | null {
  const cleaned = raw
    .replace(/^\uFEFF/, "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  const candidates: string[] = [];
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const start =
    firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (start >= 0) {
    const lastBrace = cleaned.lastIndexOf("}");
    const lastBracket = cleaned.lastIndexOf("]");
    const end = Math.max(lastBrace, lastBracket);
    if (end > start) candidates.push(cleaned.slice(start, end + 1));
  }
  candidates.push(cleaned);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      /* try next */
    }
  }
  return null;
}

/** JSON completion + validation. Validation returns null to reject the payload. */
export async function aiJson<T>(
  args: CompletionArgs,
  validate: (value: unknown) => T | null,
): Promise<T | null> {
  const result = await complete({ ...args, json: true });
  if (!result) return null;

  const parsed = extractJson(result.content);
  const valid = parsed == null ? null : validate(parsed);
  if (!valid) {
    console.warn(`[ai] ${MODEL} returned JSON that did not match the expected shape`);
    return null;
  }
  return valid;
}
