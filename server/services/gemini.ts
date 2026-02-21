import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
});

export interface GeneratedVocabulary {
  word: string;
  pronunciation: string;
  definition: string;
  sentence: string;
  level?: string;
}

export interface LennyVocabularyEntry {
  word: string;
  sentence: string;
}

const LENNY_VOCAB_PATH = path.join(import.meta.dirname, "..", "data", "lenny-vocabulary.json");
let lennyVocabularyCache: LennyVocabularyEntry[] | null = null;

function getLennyVocabulary(): LennyVocabularyEntry[] {
  if (lennyVocabularyCache !== null) return lennyVocabularyCache;
  try {
    if (fs.existsSync(LENNY_VOCAB_PATH)) {
      const raw = fs.readFileSync(LENNY_VOCAB_PATH, "utf-8");
      const list = JSON.parse(raw) as LennyVocabularyEntry[];
      lennyVocabularyCache = Array.isArray(list) ? list : [];
    } else {
      lennyVocabularyCache = [];
    }
  } catch {
    lennyVocabularyCache = [];
  }
  return lennyVocabularyCache;
}

function sampleFromLenny(count: number, excludeWords: string[]): LennyVocabularyEntry[] {
  const list = getLennyVocabulary();
  const excludeSet = new Set(excludeWords.map((w) => w.toLowerCase()));
  const pool = list.filter((e) => !excludeSet.has(e.word.toLowerCase()));
  if (pool.length === 0 || count <= 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function generateVocabulary(
  level: string = "B1-C1",
  numWords: number = 10,
  excludeWords: string[] = []
): Promise<GeneratedVocabulary[]> {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required");
  }

  const excludeWordsText = excludeWords.length > 0
    ? ` Do not include these words: ${excludeWords.join(", ")}.`
    : "";

  const lennyCount = numWords >= 10 ? 3 : numWords >= 6 ? 2 : 1;
  const b1b2Count = numWords >= 8 ? 2 : 1;
  const b2c1Count = numWords >= 8 ? 3 : numWords >= 6 ? 2 : 1;
  const lennySamples = sampleFromLenny(lennyCount, excludeWords);
  const additionalCount = numWords - lennySamples.length;

  let prompt: string;
  if (lennySamples.length > 0 && additionalCount > 0) {
    const lennyBlock = lennySamples
      .map((e) => `- word: "${e.word}", sentence: "${e.sentence.replace(/"/g, '\\"')}"`)
      .join("\n");
    prompt = `You must output exactly ${numWords} words in the "words" JSON array.

Part 1 - From Lenny's Podcast (include these first, in order): For each item below, add "pronunciation" (KK Phonetic Symbol) and "definition" (English). Keep "word" and "sentence" exactly as given.
${lennyBlock}

Part 2 - Generate ${additionalCount} more words: Each with word, pronunciation (KK), definition, and sentence. Level ${level}. Include at least ${b1b2Count} word(s) B1-B2 and at least ${b2c1Count} word(s) B2 or C1. At least 2 words must be commonly used in annual performance reviews or appraisals (e.g. performance review, appraisal, KPI, OKR, promotion); use example sentences that sound like real manager-employee evaluation conversations.${excludeWordsText}

Output format: JSON object with single key "words", value an array of ${numWords} objects each with keys: word, pronunciation, definition, sentence. No extra text or code block.`;
  } else if (lennySamples.length > 0 && additionalCount <= 0) {
    const lennyBlock = lennySamples
      .map((e) => `- word: "${e.word}", sentence: "${e.sentence.replace(/"/g, '\\"')}"`)
      .join("\n");
    prompt = `Output exactly ${numWords} words in the "words" JSON array. For each item below, add "pronunciation" (KK Phonetic Symbol) and "definition" (English). Keep "word" and "sentence" exactly as given.
${lennyBlock}

Output format: JSON object with single key "words", value an array of objects each with keys: word, pronunciation, definition, sentence. No extra text or code block.`;
  } else {
    prompt = `Generate a list of ${numWords} English vocabulary words with KK Phonetic Symbol, with their English definition, and with one example sentence each, suitable for ${level} level. Format the output as a pure JSON array of objects. Please include at least ${b1b2Count} word${b1b2Count > 1 ? "s" : ""} in level B1-B2 and at least ${b2c1Count} word${b2c1Count > 1 ? "s" : ""} in level B2 or C1. Each object should have "word", "pronunciation", "definition", and "sentence" keys. Please consider at least ${lennyCount} word${lennyCount > 1 ? "s" : ""} from Lenny's Podcast's transcript and sentences, so it's more tech related. Also, make sure at least 2 of the words are commonly used by employees when talking about annual performance reviews or appraisals (e.g. performance review, appraisal, KPI, OKR, promotion discussion). These performance-review-related words should have example sentences that sound like real conversations between employees and managers about yearly evaluations. Do not include any extra text, explanation, or code block. Only output the JSON array.${excludeWordsText}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            words: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  word: { type: "string" },
                  pronunciation: { type: "string" },
                  definition: { type: "string" },
                  sentence: { type: "string" },
                },
                required: ["word", "pronunciation", "definition", "sentence"],
              },
            },
          },
          required: ["words"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const data = JSON.parse(rawJson);

    if (!data.words || !Array.isArray(data.words)) {
      throw new Error("Invalid response format from Gemini API");
    }

    return data.words.map((item: Record<string, unknown>) => ({
      word: (item.word as string) || "N/A",
      pronunciation: (item.pronunciation as string) || "N/A",
      definition: (item.definition as string) || "N/A",
      sentence: (item.sentence as string) || "N/A",
      level,
    }));
  } catch (error) {
    console.error("Error generating vocabulary:", error);
    throw new Error(
      `Failed to generate vocabulary: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
