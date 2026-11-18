#!/usr/bin/env node
/**
 * Downloads the Supertonic 3 (int8) narrator into .data/models/supertonic-3-int8.
 *
 * The weights are ~139 MB, so they are not committed. Run:
 *   npm run tts:prepare
 *
 * Files are verified against the SHA256SUMS published with the model, and
 * already-correct files are skipped, so re-running is cheap.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const REPO = "finestcrtn/supertonic-3-int8";
const BASE = `https://huggingface.co/${REPO}/resolve/main`;
const DIR = path.join(process.cwd(), ".data", "models", "supertonic-3-int8");

const FILES = [
  "duration_predictor.int8.onnx",
  "text_encoder.int8.onnx",
  "vector_estimator.int8.onnx",
  "vocoder.int8.onnx",
  "tts.json",
  "unicode_indexer.bin",
  "voice.bin",
];

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function download(file) {
  const target = path.join(DIR, file);
  const response = await fetch(`${BASE}/${file}`, { redirect: "follow" });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  if (!response.body) throw new Error(`${file}: empty response`);

  const total = Number(response.headers.get("content-length") ?? 0);
  const tmp = `${target}.part`;
  const out = fs.createWriteStream(tmp);
  let written = 0;
  let lastTick = 0;

  for await (const chunk of response.body) {
    out.write(chunk);
    written += chunk.length;
    const now = Date.now();
    if (now - lastTick > 400) {
      lastTick = now;
      const percent = total ? ` ${((written / total) * 100).toFixed(0)}%` : "";
      process.stdout.write(`\r  ${file} — ${mb(written)}${percent}   `);
    }
  }
  await new Promise((resolve, reject) => {
    out.end((error) => (error ? reject(error) : resolve()));
  });
  fs.renameSync(tmp, target);
  process.stdout.write(`\r  ${file} — ${mb(written)} ✓          \n`);
}

function sha256(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

async function expectedSums() {
  const response = await fetch(`${BASE}/SHA256SUMS`);
  if (!response.ok) return null;
  const text = await response.text();
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = line.trim().match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (match) map.set(match[2].trim(), match[1].toLowerCase());
  }
  return map;
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  console.log(`Supertonic 3 (int8) → ${DIR}\n`);

  const sums = await expectedSums().catch(() => null);

  for (const file of FILES) {
    const target = path.join(DIR, file);
    const expected = sums?.get(file);

    if (fs.existsSync(target) && fs.statSync(target).size > 0) {
      if (!expected || sha256(target) === expected) {
        console.log(`  ${file} — już jest ✓`);
        continue;
      }
      console.log(`  ${file} — suma się nie zgadza, pobieram ponownie`);
      fs.rmSync(target, { force: true });
    }

    await download(file);

    if (expected) {
      const actual = sha256(target);
      if (actual !== expected) {
        throw new Error(`SHA-256 mismatch for ${file}\n  expected ${expected}\n  actual   ${actual}`);
      }
    }
  }

  console.log("\nGotowe. Lektor działa offline — bez klucza API i bez GPU.");
}

main().catch((error) => {
  console.error(`\nNie udało się pobrać modelu: ${error.message}`);
  process.exitCode = 1;
});
