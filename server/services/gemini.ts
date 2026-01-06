import { GoogleGenAI } from "@google/genai";
import type { InsertVocabularyWord } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
});

export interface GeneratedVocabulary {
  // 和 InsertVocabularyWord 對應，但不含 id
  word: string;
  pronunciation: string;
  definition: string;
  sentence: string;
  level?: string;
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
    ? ` Do not include these words: ${excludeWords.join(', ')}.`
    : '';
  
  // Dynamically adjust requirements based on numWords to avoid unsatisfiable constraints
  // When numWords is 6, total minimum requirements must not exceed 6
  const lennyCount = numWords >= 10 ? 3 : numWords >= 6 ? 2 : 1;
  const b1b2Count = numWords >= 8 ? 2 : 1;
  const b2c1Count = numWords >= 8 ? 3 : numWords >= 6 ? 2 : 1;
    
  const prompt = `Generate a list of ${numWords} English vocabulary words with KK Phonetic Symbol, with their English definition, and with one example sentence each, suitable for ${level} level. Format the output as a pure JSON array of objects. Please include at least ${b1b2Count} word${b1b2Count > 1 ? 's' : ''} in level B1-B2 and at least ${b2c1Count} word${b2c1Count > 1 ? 's' : ''} in level B2 or C1. Each object should have 'word', 'pronunciation', 'definition', and 'sentence' keys. Please consider at least ${lennyCount} word${lennyCount > 1 ? 's' : ''} from Lenny's Podcast's transcript and sentences, so it's more tech related. Do not include any extra text, explanation, or code block. Only output the JSON array.${excludeWordsText}`;

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
                  sentence: { type: "string" }
                },
                required: ["word", "pronunciation", "definition", "sentence"]
              }
            }
          },
          required: ["words"]
        }
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

    return data.words.map((item: any) => ({
      word: item.word || 'N/A',
      pronunciation: item.pronunciation || 'N/A',
      definition: item.definition || 'N/A',
      sentence: item.sentence || 'N/A',
      level,
    }));

  } catch (error) {
    console.error("Error generating vocabulary:", error);
    throw new Error(`Failed to generate vocabulary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
