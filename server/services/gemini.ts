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

// 太基本的常見字，不適合作為學習單字
const BASIC_WORDS = new Set([
  "about","after","again","also","back","because","been","before","being","between",
  "bring","build","built","called","came","come","comes","could","doing","down","each",
  "even","every","first","from","give","going","good","great","have","here","just",
  "keep","know","last","leave","like","look","made","make","many","more","most","much",
  "need","never","next","number","often","only","other","over","people","place","point",
  "right","same","should","since","some","start","still","such","take","than","that",
  "their","them","then","there","these","they","thing","think","this","time","under",
  "until","upon","used","very","want","well","were","what","when","where","which",
  "while","will","with","work","would","year","your",
]);

function isLikelyProperNoun(word: string): boolean {
  // 人名通常出現在原句中為大寫開頭，且不是句首
  // 這裡用簡單規則：單字在 lenny 資料中的 sentence 裡只以大寫出現
  return false; // 讓下面的長度和基本字過濾處理即可
}

function sampleFromLenny(count: number, excludeWords: string[]): LennyVocabularyEntry[] {
  const list = getLennyVocabulary();
  const excludeSet = new Set(excludeWords.map((w) => w.toLowerCase()));
  const pool = list.filter((e) => {
    const w = e.word.toLowerCase();
    if (excludeSet.has(w)) return false;
    if (w.length < 6) return false;                  // 太短的字跳過
    if (BASIC_WORDS.has(w)) return false;            // 太基本的字跳過
    if (/^[a-z]/.test(e.word) === false) return false; // 非小寫開頭（可能是縮寫）跳過
    if (/[^a-z\-]/.test(w)) return false;            // 含非字母字元跳過
    return true;
  });
  if (pool.length === 0 || count <= 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

const TOPIC_PROMPTS: Record<string, string> = {
  lenny:     "tech, product management, startups, SaaS, growth hacking, engineering culture (inspired by Lenny's Podcast)",
  workplace: "professional workplace communication, meetings, emails, team collaboration, business English",
  taiwan:    "Taiwan history, politics, cross-strait relations, democracy, Taiwanese culture and society",
  travel:    "travel, tourism, food culture, restaurants, hospitality, sightseeing, accommodation",
  daily:     "daily life, casual conversation, errands, shopping, social situations, small talk",
};

export async function generateVocabulary(
  levels: string[] = ["B1", "B2"],
  numWords: number = 10,
  excludeWords: string[] = [],
  topics: string[] = ["lenny"]
): Promise<GeneratedVocabulary[]> {
  const levelStr = levels.length === 1 ? levels[0] : levels.join(", ");
  const levelInstruction = levels.length === 1
    ? `at ${levels[0]} level`
    : `at ${levelStr} level (distribute words evenly across these difficulty levels)`;
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required");
  }

  const excludeWordsText = excludeWords.length > 0
    ? ` Do not include these words: ${excludeWords.join(", ")}.`
    : "";

  // 只有選了 lenny 主題才 sample Lenny 單字
  const useLenny = topics.includes("lenny");
  const lennyCount = useLenny ? (numWords >= 10 ? 3 : numWords >= 6 ? 2 : 1) : 0;
  const lennySamples = useLenny ? sampleFromLenny(lennyCount, excludeWords) : [];
  const additionalCount = numWords - lennySamples.length;

  // 組合主題描述給 Gemini
  const topicDescriptions = topics
    .filter((t) => TOPIC_PROMPTS[t])
    .map((t) => TOPIC_PROMPTS[t])
    .join("; ");
  const topicInstruction = `Topics to draw from: ${topicDescriptions}. ${topics.length > 1 ? "Distribute words evenly across these topics." : ""}`;

  let prompt: string;
  if (lennySamples.length > 0 && additionalCount > 0) {
    const lennyBlock = lennySamples
      .map((e) => `- word: "${e.word}", sentence: "${e.sentence.replace(/"/g, '\\"')}"`)
      .join("\n");
    prompt = `You must output exactly ${numWords} words in the "words" JSON array.

Part 1 - From Lenny's Podcast (include these first, in order): For each item below, add "pronunciation" (KK Phonetic Symbol) and "definition" (English). Keep "word" and "sentence" exactly as given.
${lennyBlock}

Part 2 - Generate ${additionalCount} more words ${levelInstruction}. ${topicInstruction} Each word must have word, pronunciation (KK Phonetic Symbol), definition (English), and one natural example sentence.${excludeWordsText}

Output format: JSON object with single key "words", value an array of ${numWords} objects each with keys: word, pronunciation, definition, sentence. No extra text or code block.`;
  } else if (lennySamples.length > 0 && additionalCount <= 0) {
    const lennyBlock = lennySamples
      .map((e) => `- word: "${e.word}", sentence: "${e.sentence.replace(/"/g, '\\"')}"`)
      .join("\n");
    prompt = `Output exactly ${numWords} words in the "words" JSON array. For each item below, add "pronunciation" (KK Phonetic Symbol) and "definition" (English). Keep "word" and "sentence" exactly as given.
${lennyBlock}

Output format: JSON object with single key "words", value an array of objects each with keys: word, pronunciation, definition, sentence. No extra text or code block.`;
  } else {
    prompt = `Generate exactly ${numWords} English vocabulary words ${levelInstruction}. ${topicInstruction} Each word must have word, pronunciation (KK Phonetic Symbol), definition (English), and one natural example sentence. Output format: JSON object with single key "words", value an array of ${numWords} objects each with keys: word, pronunciation, definition, sentence. No extra text or code block.${excludeWordsText}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
      level: levelStr,
    }));
  } catch (error) {
    console.error("Error generating vocabulary:", error);
    throw new Error(
      `Failed to generate vocabulary: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
