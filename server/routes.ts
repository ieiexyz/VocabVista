import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateVocabulary } from "./services/gemini";
import { vocabularyRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate vocabulary endpoint
  app.post("/api/vocabulary/generate", async (req, res) => {
    try {
      const { level, numWords, excludeWords } = vocabularyRequestSchema.parse(req.body);
      
      const vocabulary = await generateVocabulary(level, numWords, excludeWords);
      
      res.json({
        success: true,
        data: vocabulary
      });
    } catch (error) {
      console.error("Error in vocabulary generation:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate vocabulary"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
