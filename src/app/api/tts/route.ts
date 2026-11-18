import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { synthesize, ttsAssetsPresent, DEFAULT_SPEED, DEFAULT_STEPS } from "@/lib/tts/supertonic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** One request renders a whole narration step; 900 chars keeps latency sane. */
const MAX_CHARS = 900;

type Body = {
  text?: unknown;
  voice?: unknown;
  speed?: unknown;
  steps?: unknown;
};

function num(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(request: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Zaloguj się, żeby usłyszeć lektora." }, { status: 401 });
  }

  if (!ttsAssetsPresent()) {
    return NextResponse.json(
      { error: "Model lektora nie jest pobrany. Uruchom `npm run tts:prepare`." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "Brak tekstu." }, { status: 400 });
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: "Tekst jest za długi." }, { status: 413 });
  }

  try {
    const started = Date.now();
    const { wav, durationSec, cached } = await synthesize(text, {
      voice: num(body.voice, 0),
      speed: num(body.speed, DEFAULT_SPEED),
      steps: num(body.steps, DEFAULT_STEPS),
      lang: "pl",
    });
    console.log(
      `[tts] ${cached ? "cache" : "synth"} ${durationSec.toFixed(2)}s audio in ${Date.now() - started} ms`,
    );

    return new Response(new Uint8Array(wav), {
      headers: {
        "content-type": "audio/wav",
        "content-length": String(wav.length),
        "cache-control": "private, max-age=86400",
        "x-tts-duration": durationSec.toFixed(3),
        "x-tts-cached": cached ? "1" : "0",
      },
    });
  } catch (error) {
    console.error("[tts] synthesis failed:", error);
    return NextResponse.json({ error: "Lektor chwilowo nie działa." }, { status: 500 });
  }
}
