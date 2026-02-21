/**
 * Builds lenny-vocabulary.json from Lenny's Podcast transcripts.
 * Run after cloning https://github.com/ChatPRD/lennys-podcast-transcripts
 * into data/lennys-podcast-transcripts (from project root).
 *
 * Usage: npm run build:lenny-vocabulary
 * Or:    npx tsx server/scripts/build-lenny-vocabulary.ts
 */

import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const EPISODES_DIR = path.join(PROJECT_ROOT, "data", "lennys-podcast-transcripts", "episodes");
const OUT_PATH = path.join(PROJECT_ROOT, "server", "data", "lenny-vocabulary.json");

export interface LennyVocabularyEntry {
  word: string;
  sentence: string;
}

function extractContentFromTranscript(raw: string): string {
  const parts = raw.split("---");
  if (parts.length >= 3) {
    return parts.slice(2).join("---").trim();
  }
  return raw.trim();
}

function getSentences(content: string): string[] {
  return content
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length >= 20 && s.length <= 400);
}

function pickVocabularyWord(sentence: string): string | null {
  const words = sentence.match(/\b[A-Za-z]{5,}\b/g);
  if (!words?.length) return null;
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b));
  return longest.toLowerCase();
}

function buildVocabularyList(): LennyVocabularyEntry[] {
  if (!fs.existsSync(EPISODES_DIR)) {
    console.error(
      `Episodes directory not found: ${EPISODES_DIR}\n` +
        "Clone the repo: git clone https://github.com/ChatPRD/lennys-podcast-transcripts data/lennys-podcast-transcripts"
    );
    process.exit(1);
  }

  const seen = new Set<string>();
  const list: LennyVocabularyEntry[] = [];
  const guestDirs = fs.readdirSync(EPISODES_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const guest of guestDirs) {
    const transcriptPath = path.join(EPISODES_DIR, guest.name, "transcript.md");
    if (!fs.existsSync(transcriptPath)) continue;
    const raw = fs.readFileSync(transcriptPath, "utf-8");
    const content = extractContentFromTranscript(raw);
    const sentences = getSentences(content);

    for (const sentence of sentences) {
      const word = pickVocabularyWord(sentence);
      if (!word || seen.has(word)) continue;
      seen.add(word);
      list.push({ word, sentence });
    }
  }

  return list;
}

function main() {
  console.log("Building Lenny vocabulary from", EPISODES_DIR);
  const list = buildVocabularyList();
  const outDir = path.dirname(OUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(OUT_PATH, JSON.stringify(list, null, 2), "utf-8");
  console.log("Wrote", list.length, "entries to", OUT_PATH);
}

main();
