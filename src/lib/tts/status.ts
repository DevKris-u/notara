/**
 * Filesystem-only checks for the local narrator.
 *
 * Kept separate from `supertonic.ts` so pages can show the narrator's status
 * without pulling the native ONNX runtime into their module graph.
 */

import fs from "node:fs";
import path from "node:path";

export const TTS_MODEL_REPO = "finestcrtn/supertonic-3-int8";
export const TTS_MODEL_NAME = "Supertonic 3 · int8";
export const TTS_SAMPLE_RATE = 44100;
export const TTS_VOICE_COUNT = 10;

export const TTS_MODEL_FILES = [
  "duration_predictor.int8.onnx",
  "text_encoder.int8.onnx",
  "vector_estimator.int8.onnx",
  "vocoder.int8.onnx",
  "tts.json",
  "unicode_indexer.bin",
  "voice.bin",
] as const;

export function ttsModelDir(): string {
  return path.join(process.cwd(), ".data", "models", "supertonic-3-int8");
}

/** True when every weight file is present, so the UI can tell the user what to run. */
export function ttsAssetsPresent(): boolean {
  const dir = ttsModelDir();
  try {
    return TTS_MODEL_FILES.every((file) => fs.statSync(path.join(dir, file)).size > 0);
  } catch {
    return false;
  }
}
