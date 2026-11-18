/**
 * Supertonic 3 (int8) text-to-speech — server only.
 *
 * The model is a 4-stage ONNX pipeline (duration predictor → text encoder →
 * flow-matching vector estimator → vocoder) that renders 44.1 kHz speech
 * locally on the CPU. Nothing leaves the machine and no API key is involved.
 *
 * Weights are not committed: `npm run tts:prepare` downloads them into
 * `.data/models/supertonic-3-int8/` and checks the published SHA-256 sums.
 *
 * Layout notes (reverse-engineered from the published assets):
 *   unicode_indexer.bin  Int32LE[65536]   codepoint → token id (-1 = unused)
 *   voice.bin            48-byte header, then 10 voices of
 *                        style_ttl [50,256] + style_dp [8,16] float32
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as ort from "onnxruntime-node";
import {
  TTS_SAMPLE_RATE,
  TTS_VOICE_COUNT,
  ttsAssetsPresent,
  ttsModelDir,
} from "./status";

export const SAMPLE_RATE = TTS_SAMPLE_RATE;
export const VOICE_COUNT = TTS_VOICE_COUNT;

/** Slower than the model's native pace — a lesson should sound like a teacher, not a newsreader. */
export const DEFAULT_SPEED = 1;
/** More flow-matching steps = fewer artefacts; the cost is hidden by prefetching. */
export const DEFAULT_STEPS = 7;

/**
 * The duration predictor that ships with the model reads Polish at ~29 tokens
 * per second, which swallows syllables and forces the vocoder to compress the
 * sentence. We pace the narration deterministically instead: 15 tokens per
 * second is a calm, teacher-like Polish tempo, and it never varies between
 * sentences the way the predictor did.
 */
const TOKENS_PER_SECOND = 15;
export { ttsAssetsPresent, ttsModelDir };

const MODEL_DIR = ttsModelDir();
const CACHE_DIR = path.join(process.cwd(), ".data", "tts");

const TTL_TOKENS = 50;
const TTL_DIM = 256;
const DP_TOKENS = 8;
const DP_DIM = 16;
const HEADER_BYTES = 48;

const LANGS = new Set([
  "en", "ko", "ja", "ar", "bg", "cs", "da", "de", "el", "es", "et", "fi",
  "fr", "hi", "hr", "hu", "id", "it", "lt", "lv", "nl", "pl", "pt", "ro",
  "ru", "sk", "sl", "sv", "tr", "uk", "vi", "na",
]);

export type TtsConfig = {
  ae: { sample_rate: number; base_chunk_size: number };
  ttl: { chunk_compress_factor: number; latent_dim: number };
};

export type SynthesisResult = {
  wav: Buffer;
  durationSec: number;
  cached: boolean;
};

export type SynthesizeOptions = {
  voice?: number;
  speed?: number;
  steps?: number;
  lang?: string;
};

type Engine = {
  cfg: TtsConfig;
  indexer: Int32Array;
  voices: Buffer;
  textEncoder: ort.InferenceSession;
  vectorEstimator: ort.InferenceSession;
  vocoder: ort.InferenceSession;
};

let enginePromise: Promise<Engine> | null = null;

async function loadEngine(): Promise<Engine> {
  if (!ttsAssetsPresent()) {
    throw new Error("Brak modelu TTS. Uruchom `npm run tts:prepare`.");
  }
  const started = Date.now();
  const cfg = JSON.parse(fs.readFileSync(path.join(MODEL_DIR, "tts.json"), "utf8")) as TtsConfig;

  const indexerBuf = fs.readFileSync(path.join(MODEL_DIR, "unicode_indexer.bin"));
  const indexer = new Int32Array(
    indexerBuf.buffer,
    indexerBuf.byteOffset,
    Math.floor(indexerBuf.length / 4),
  );

  const voices = fs.readFileSync(path.join(MODEL_DIR, "voice.bin"));

  const open = (file: string) =>
    ort.InferenceSession.create(path.join(MODEL_DIR, file), {
      intraOpNumThreads: 0,
      interOpNumThreads: 0,
      graphOptimizationLevel: "all",
      executionMode: "sequential",
    });

  const [textEncoder, vectorEstimator, vocoder] = await Promise.all([
    open("text_encoder.int8.onnx"),
    open("vector_estimator.int8.onnx"),
    open("vocoder.int8.onnx"),
  ]);

  console.log(`[tts] supertonic-3 int8 ready in ${Date.now() - started} ms`);
  return { cfg, indexer, voices, textEncoder, vectorEstimator, vocoder };
}

function getEngine(): Promise<Engine> {
  if (!enginePromise) {
    enginePromise = loadEngine().catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

/* ------------------------------------------------------------------ text -- */

const EMOJI =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]+/gu;

const REPLACEMENTS: Record<string, string> = {
  "–": "-",
  "‑": "-",
  "—": "-",
  "−": "-",
  "…": ".",
  _: " ",
  "\u201C": '"',
  "\u201D": '"',
  "\u2018": "'",
  "\u2019": "'",
  "„": '"',
  "´": "'",
  "`": "'",
  "*": " ",
  "[": " ",
  "]": " ",
  "|": " ",
  "/": " ",
  "#": " ",
  "→": " ",
  "←": " ",
  "•": " ",
  "·": " ",
  "@": " at ",
  "%": " procent ",
};

/** Mirrors Supertonic's own preprocessing so the model sees what it was trained on. */
export function prepareText(raw: string, lang: string): string {
  let text = raw.normalize("NFKD").replace(EMOJI, "");
  for (const [from, to] of Object.entries(REPLACEMENTS)) text = text.split(from).join(to);
  text = text.replace(/[♥☆♡©\\]/g, "");
  text = text.replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (!/[.!?;:,'")\]}…]$/.test(text)) text += ".";
  return `<${lang}>${text}</${lang}>`;
}

function chunkText(text: string, maxLen = 190): string[] {
  const paragraphs = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];

  const push = (sentence: string) => {
    let rest = sentence.trim();
    while (rest.length > maxLen) {
      const cut = rest.lastIndexOf(" ", maxLen);
      const at = cut > maxLen * 0.5 ? cut : maxLen;
      chunks.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) chunks.push(rest);
  };

  for (const paragraph of paragraphs) {
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    let current = "";
    for (const sentence of sentences) {
      if (!current) {
        current = sentence;
      } else if (current.length + sentence.length + 1 <= maxLen) {
        current += " " + sentence;
      } else {
        push(current);
        current = sentence;
      }
    }
    if (current) push(current);
  }
  return chunks;
}

/* --------------------------------------------------------------- inference -- */

/** Past this, a single chunk would be absurdly long — split the text instead. */
const MAX_CHUNK_SEC = 40;

function styleTensors(engine: Engine, voiceIndex: number) {
  const perVoice = (TTL_TOKENS * TTL_DIM + DP_TOKENS * DP_DIM) * 4;
  const offset = HEADER_BYTES + voiceIndex * perVoice;
  if (offset + perVoice > engine.voices.length) throw new Error("Nieprawidłowy głos");

  const ttl = new Float32Array(
    engine.voices.buffer,
    engine.voices.byteOffset + offset,
    TTL_TOKENS * TTL_DIM,
  );
  return { ttl: new ort.Tensor("float32", new Float32Array(ttl), [1, TTL_TOKENS, TTL_DIM]) };
}

function tokenize(text: string, lang: string, indexer: Int32Array) {
  const prepared = prepareText(text, lang);
  const ids: number[] = [];
  for (const char of prepared) {
    const mapped = indexer[char.codePointAt(0) ?? 0];
    if (mapped >= 0) ids.push(mapped);
  }
  if (!ids.length) ids.push(indexer[32] >= 0 ? indexer[32] : 0);
  return {
    ids: BigInt64Array.from(ids.map((id) => BigInt(id))),
    length: ids.length,
  };
}

async function inferChunk(
  engine: Engine,
  text: string,
  lang: string,
  style: ReturnType<typeof styleTensors>,
  steps: number,
  speed: number,
): Promise<Float32Array> {
  const { ids, length } = tokenize(text, lang, engine.indexer);
  const textIds = new ort.Tensor("int64", ids, [1, length]);
  const textMask = new ort.Tensor("float32", new Float32Array(length).fill(1), [1, 1, length]);

  // Pacing comes from the token count, not from a predicted duration: the
  // predictor's estimate swings with sentence shape, which is exactly how the
  // lektor ended up racing through one step and crawling through the next.
  const seconds = Math.min(
    MAX_CHUNK_SEC,
    Math.max(0.35, length / (TOKENS_PER_SECOND * speed)),
  );

  const encoded = await engine.textEncoder.run({
    text_ids: textIds,
    style_ttl: style.ttl,
    text_mask: textMask,
  });

  const { ae, ttl } = engine.cfg;
  const compress = ttl.chunk_compress_factor;
  const chunk = ae.base_chunk_size * compress;
  const wavLen = Math.floor(seconds * ae.sample_rate);
  const latentLen = Math.floor((wavLen + chunk - 1) / chunk);
  const latentDim = ttl.latent_dim * compress;

  // Box–Muller noise, then zero out the padded tail.
  let latent = new Float32Array(latentDim * latentLen);
  for (let i = 0; i < latent.length; i++) {
    const u1 = Math.max(0.0001, Math.random());
    const u2 = Math.random();
    latent[i] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  const latentMask = new Float32Array(latentLen);
  const keep = Math.min(latentLen, Math.floor((wavLen + chunk - 1) / chunk));
  for (let i = 0; i < keep; i++) latentMask[i] = 1;
  for (let d = 0; d < latentDim; d++) {
    const base = d * latentLen;
    for (let t = 0; t < latentLen; t++) latent[base + t] *= latentMask[t];
  }

  const latentMaskTensor = new ort.Tensor("float32", latentMask, [1, 1, latentLen]);
  const totalStep = new ort.Tensor("float32", new Float32Array([steps]), [1]);

  for (let step = 0; step < steps; step++) {
    const out = await engine.vectorEstimator.run({
      noisy_latent: new ort.Tensor("float32", latent, [1, latentDim, latentLen]),
      text_emb: encoded.text_emb,
      style_ttl: style.ttl,
      latent_mask: latentMaskTensor,
      text_mask: textMask,
      current_step: new ort.Tensor("float32", new Float32Array([step]), [1]),
      total_step: totalStep,
    });
    latent = new Float32Array(out.denoised_latent.data as Float32Array);
  }

  const vocoded = await engine.vocoder.run({
    latent: new ort.Tensor("float32", latent, [1, latentDim, latentLen]),
  });
  const wav = new Float32Array(vocoded.wav_tts.data as Float32Array);
  // A single NaN would poison the loudness pass and turn the clip into noise.
  for (let i = 0; i < wav.length; i++) if (!Number.isFinite(wav[i])) wav[i] = 0;
  return wav;
}

function encodeWav(samples: Float32Array, sampleRate = SAMPLE_RATE): Buffer {
  const dataSize = samples.length * 2;
  const buffer = Buffer.allocUnsafe(44 + dataSize);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

export function wavDurationSec(wav: Buffer): number {
  return Math.max(0, (wav.length - 44) / 2 / SAMPLE_RATE);
}

/* ------------------------------------------------------------------- cache -- */

const inflight = new Map<string, Promise<Buffer>>();
let queue: Promise<unknown> = Promise.resolve();

function cacheKey(text: string, voice: number, speed: number, steps: number, lang: string) {
  return createHash("sha256")
    .update(`${lang}|${voice}|${speed}|${steps}|${text}`)
    .digest("hex")
    .slice(0, 40);
}

/** Below this amplitude the model's output is just room tone, not speech. */
const SILENCE_FLOOR = 0.006;

/** A short pad keeps the first and last phoneme from sounding clipped. */
const EDGE_PAD_SEC = 0.045;

function trimSilence(samples: Float32Array): Float32Array {
  let first = 0;
  while (first < samples.length && Math.abs(samples[first]) < SILENCE_FLOOR) first++;
  if (first >= samples.length) return new Float32Array(Math.floor(0.08 * SAMPLE_RATE));

  let last = samples.length - 1;
  while (last > first && Math.abs(samples[last]) < SILENCE_FLOOR) last--;

  const pad = Math.floor(EDGE_PAD_SEC * SAMPLE_RATE);
  const from = Math.max(0, first - pad);
  const to = Math.min(samples.length, last + 1 + pad);
  return samples.subarray(from, to);
}

/**
 * Light mastering: trims the dead air the model leaves before and after each
 * phrase (it was ~400 ms at the start of every step), evens out loudness, keeps
 * headroom for peak overshoot and fades the edges so joined chunks never click.
 * Peaks are caught by a soft limiter rather than by a hard clamp, so a loud
 * syllable is rounded off instead of turning into a crackle.
 */
function polish(samples: Float32Array): Float32Array {
  const trimmed = trimSilence(samples);
  const out = new Float32Array(trimmed.length);
  if (!out.length) return out;

  let sum = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const value = trimmed[i];
    sum += value * value;
  }

  const rms = Math.sqrt(sum / trimmed.length);
  let gain = rms > 0.0008 ? 0.1 / rms : 1;
  gain = Math.min(2.2, Math.max(0.7, gain));

  const knee = 0.7;
  const span = 0.94 - knee;
  for (let i = 0; i < trimmed.length; i++) {
    const value = trimmed[i] * gain;
    const magnitude = Math.abs(value);
    if (magnitude <= knee) {
      out[i] = value;
    } else {
      const over = (magnitude - knee) / (1 - knee);
      out[i] = Math.sign(value) * (knee + span * Math.tanh(over));
    }
  }

  const fade = Math.min(Math.floor(0.018 * SAMPLE_RATE), Math.floor(out.length / 2));
  for (let i = 0; i < fade; i++) {
    const k = Math.sin((i / fade) * (Math.PI / 2));
    out[i] *= k;
    out[out.length - 1 - i] *= k;
  }
  return out;
}

async function render(text: string, opts: Required<SynthesizeOptions>): Promise<Buffer> {
  const engine = await getEngine();
  const style = styleTensors(engine, opts.voice);
  const chunks = chunkText(text);
  const pieces: Float32Array[] = [];
  // A real breath between sentences is what stops the lektor sounding rushed.
  const silence = new Float32Array(Math.floor(0.3 * SAMPLE_RATE));

  for (let i = 0; i < chunks.length; i++) {
    let piece: Float32Array | null = null;
    for (let attempt = 0; attempt < 2 && !piece; attempt++) {
      try {
        piece = await inferChunk(engine, chunks[i], opts.lang, style, opts.steps, opts.speed);
      } catch (error) {
        console.warn(`[tts] chunk ${i + 1}/${chunks.length} failed (attempt ${attempt + 1}):`, error);
      }
    }
    if (!piece) throw new Error("Nie udało się zsyntezować fragmentu narracji.");

    const clean = polish(piece);
    if (clean.length < SAMPLE_RATE * 0.05) continue;
    if (pieces.length) pieces.push(silence);
    pieces.push(clean);
  }

  if (!pieces.length) throw new Error("Nagranie wyszło puste.");

  const total = pieces.reduce((sum, piece) => sum + piece.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const piece of pieces) {
    merged.set(piece, offset);
    offset += piece.length;
  }
  return encodeWav(merged);
}

/**
 * Synthesises `text` and memoises the WAV on disk. Concurrent callers asking for
 * the same sentence share one inference; different sentences are queued so a
 * prefetch burst cannot starve the CPU.
 */
export async function synthesize(text: string, options: SynthesizeOptions = {}): Promise<SynthesisResult> {
  const clean = text.trim();
  if (!clean) throw new Error("Puste zdanie do wypowiedzenia.");

  const voice = Math.min(VOICE_COUNT - 1, Math.max(0, Math.round(options.voice ?? 0)));
  const speed = Math.min(1.6, Math.max(0.6, options.speed ?? DEFAULT_SPEED));
  const steps = Math.min(12, Math.max(2, Math.round(options.steps ?? Number(process.env.TTS_STEPS ?? DEFAULT_STEPS))));
  const lang = LANGS.has(options.lang ?? "pl") ? (options.lang ?? "pl") : "pl";

  const key = cacheKey(clean, voice, speed, steps, lang);
  const file = path.join(CACHE_DIR, `${key}.wav`);
  if (fs.existsSync(file)) {
    const wav = fs.readFileSync(file);
    return { wav, durationSec: wavDurationSec(wav), cached: true };
  }

  const existing = inflight.get(key);
  if (existing) {
    const wav = await existing;
    return { wav, durationSec: wavDurationSec(wav), cached: false };
  }

  const job = queue.then(async () => {
    const wav = await render(clean, { voice, speed, steps, lang });
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(file, wav);
    } catch (error) {
      console.warn("[tts] could not cache audio:", error);
    }
    return wav;
  });

  queue = job.catch(() => undefined);
  inflight.set(key, job);
  try {
    const wav = await job;
    return { wav, durationSec: wavDurationSec(wav), cached: false };
  } finally {
    inflight.delete(key);
  }
}
