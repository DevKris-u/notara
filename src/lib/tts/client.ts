export type Clip = { blob: Blob; durationMs: number };

export const VOICE_STORAGE_KEY = "notara.voice";

/** How many rendered sentences we keep as Blobs in the tab before dropping the oldest. */
const TTS_CACHE_LIMIT = 60;

/**
 * Sentences already rendered in this tab, so stepping back is instant. We keep
 * the Blob rather than an object URL: a URL can be revoked by accident while an
 * <audio> element is still playing it, and that is heard as the voice cutting out.
 */
const cache = new Map<string, Promise<Clip | null>>();
let serverModelMissing = false;

export function storedVoice(fallback = 0): number {
  if (typeof window === "undefined") return fallback;
  const raw = Number(window.localStorage.getItem(VOICE_STORAGE_KEY));
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : fallback;
}

export function rememberVoice(voice: number) {
  try {
    window.localStorage.setItem(VOICE_STORAGE_KEY, String(voice));
  } catch {
    /* private mode — the choice just won't stick */
  }
}

/* A tiny store so components can read the saved voice without a hydration flash. */

let pickedVoice: number | null = null;
const voiceListeners = new Set<() => void>();

export function subscribeVoice(listener: () => void): () => void {
  voiceListeners.add(listener);
  return () => {
    voiceListeners.delete(listener);
  };
}

export function voiceSnapshot(): number {
  return pickedVoice ?? storedVoice();
}

export function serverVoiceSnapshot(): number {
  return 0;
}

export function selectVoice(voice: number) {
  pickedVoice = voice;
  rememberVoice(voice);
  for (const listener of voiceListeners) listener();
}

/** True once the server has told us the weights are not on disk. */
export function ttsUnavailable(): boolean {
  return serverModelMissing;
}

/** Playback gets its own URL; the caller revokes it once the element is done. */
export function clipUrl(clip: Clip): string {
  return URL.createObjectURL(clip.blob);
}

async function requestClip(text: string, voice: number): Promise<Clip | null> {
  if (serverModelMissing || !text.trim()) return null;
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      if (response.status === 503) serverModelMissing = true;
      return null;
    }

    const blob = await response.blob();
    if (!blob.size) return null;

    const header = Number(response.headers.get("x-tts-duration"));
    const durationMs = Number.isFinite(header) && header > 0 ? header * 1000 : estimateDuration(text);
    return { blob, durationMs };
  } catch {
    return null;
  }
}

function estimateDuration(text: string): number {
  // ~11 Polish characters per second is a safe guess when the header is absent.
  return Math.max(1800, Math.round((text.length / 11) * 1000));
}

/**
 * Returns a ready-to-play narration clip for `text`, or null when the lektor is
 * unavailable — callers then fall back to the browser's SpeechSynthesis.
 */
export function narrationClip(text: string, voice = 0): Promise<Clip | null> {
  const key = `${voice}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = requestClip(text, voice);
  cache.set(key, pending);
  if (cache.size > TTS_CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest && oldest !== key) cache.delete(oldest);
  }
  return pending;
}
