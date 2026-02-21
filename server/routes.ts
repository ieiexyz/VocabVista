import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateVocabulary } from "./services/gemini";
import {
  db,
} from "./db";
import {
  vocabularyRequestSchema,
  savedWords,
  insertSavedWordSchema,
  savedWordsQuerySchema,
  vocabularyWords,
  type InsertVocabularyWord,
} from "@shared/schema";
import { and, eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate vocabulary endpoint
  app.post("/api/vocabulary/generate", async (req, res) => {
    try {
      const { level, numWords, excludeWords, anonymousId } = vocabularyRequestSchema.parse(req.body);
      let mergedExcludeWords = [...(excludeWords ?? [])];
      if (anonymousId) {
        const saved = await db
          .select({ word: vocabularyWords.word })
          .from(savedWords)
          .innerJoin(vocabularyWords, eq(savedWords.vocabularyWordId, vocabularyWords.id))
          .where(eq(savedWords.anonymousId, anonymousId));
        const savedWordStrings = saved.map((r) => r.word);
        const excludeSet = new Set(mergedExcludeWords.map((w) => w.toLowerCase()));
        for (const w of savedWordStrings) {
          if (!excludeSet.has(w.toLowerCase())) {
            excludeSet.add(w.toLowerCase());
            mergedExcludeWords.push(w);
          }
        }
      }
      const vocabulary = await generateVocabulary(level, numWords, mergedExcludeWords);

      // 將產生的單字寫入資料庫，並回傳含 id 的結果
      const normalizeWord = (w: string) => w.charAt(0).toLowerCase() + w.slice(1);
      const rowsToInsert: InsertVocabularyWord[] = vocabulary.map((v) => ({
        word: normalizeWord(v.word),
        pronunciation: v.pronunciation,
        definition: v.definition,
        sentence: v.sentence,
        level: v.level ?? level,
      }));

      const inserted = await db
        .insert(vocabularyWords)
        .values(rowsToInsert)
        .returning();

      res.json({
        success: true,
        data: inserted,
      });
    } catch (error) {
      console.error("Error in vocabulary generation:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate vocabulary"
      });
    }
  });

  // Saved words endpoints (anonymousId-based)
  app.get("/api/saved-words", async (req, res) => {
    try {
      const { anonymousId } = savedWordsQuerySchema.parse(req.query);

      const rows = await db
        .select({
          id: savedWords.id,
          anonymousId: savedWords.anonymousId,
          createdAt: savedWords.createdAt,
          wordId: vocabularyWords.id,
          word: vocabularyWords.word,
          pronunciation: vocabularyWords.pronunciation,
          definition: vocabularyWords.definition,
          sentence: vocabularyWords.sentence,
          level: vocabularyWords.level,
        })
        .from(savedWords)
        .leftJoin(
          vocabularyWords,
          eq(savedWords.vocabularyWordId, vocabularyWords.id),
        )
        .where(eq(savedWords.anonymousId, anonymousId));

      res.json({ success: true, data: rows });
    } catch (error) {
      console.error("Error fetching saved words:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch saved words",
      });
    }
  });

  app.post("/api/saved-words", async (req, res) => {
    try {
      const payload = insertSavedWordSchema.parse(req.body);

      // 若已存在相同 anonymousId + vocabularyWordId，就不要重複插入
      const [inserted] = await db
        .insert(savedWords)
        .values(payload)
        .onConflictDoNothing()
        .returning();

      res.status(201).json({
        success: true,
        data: inserted ?? null,
      });
    } catch (error) {
      console.error("Error inserting saved word:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save word",
      });
    }
  });

  app.delete("/api/saved-words/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid id",
        });
      }

      await db.delete(savedWords).where(eq(savedWords.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting saved word:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete saved word",
      });
    }
  });

  app.delete("/api/saved-words", async (req, res) => {
    try {
      const { anonymousId } = savedWordsQuerySchema.parse(req.query);

      await db
        .delete(savedWords)
        .where(eq(savedWords.anonymousId, anonymousId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing saved words:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to clear saved words",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
