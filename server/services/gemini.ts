import { GoogleGenAI } from "@google/genai";
import type { VocabularyWord } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
});

export interface GeneratedVocabulary {
  word: string;
  pronunciation: string;
  definition: string;
  sentence: string;
}

export async function generateVocabulary(
  level: string = "B1-C1", 
  numWords: number = 10
): Promise<GeneratedVocabulary[]> {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required");
  }

  const prompt = `Generate a list of ${numWords} English vocabulary words with KK Phonetic Symbol, with their English definition, and with one example sentence each, suitable for ${level} level. Please include at least 3 words in level B2 or C1. Please consider at least 1 words from tech-related content, so it's more tech related.`;

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
      sentence: item.sentence || 'N/A'
    }));

  } catch (error) {
    console.error("Error generating vocabulary:", error);
    throw new Error(`Failed to generate vocabulary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
