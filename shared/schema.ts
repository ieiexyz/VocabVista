import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const vocabularyWords = pgTable(
  "vocabulary_words",
  {
    id: serial("id").primaryKey(),
    word: text("word").notNull(),
    pronunciation: text("pronunciation").notNull(),
    definition: text("definition").notNull(),
    sentence: text("sentence").notNull(),
    level: text("level").notNull().default("B1-C1"),
  },
  (table) => ({
    uniqueWord: uniqueIndex("vocabulary_words_word_unique").on(sql`lower(${table.word})`),
  }),
);

export const savedWords = pgTable(
  "saved_words",
  {
    id: serial("id").primaryKey(),
    // TODO: 將來若有正式登入系統，可改為 references(users.id)
    anonymousId: text("anonymous_id").notNull(),
    vocabularyWordId: integer("vocabulary_word_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // 同一個使用者對同一個單字只會有一筆收藏紀錄
    uniqueSavedWordPerUser: uniqueIndex("saved_words_anonymous_word_unique").on(
      table.anonymousId,
      table.vocabularyWordId,
    ),
    // 加速以 anonymousId 查詢已儲存單字
    anonymousIdIdx: index("saved_words_anonymous_id_idx").on(table.anonymousId),
  }),
);

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVocabularyWordSchema = createInsertSchema(vocabularyWords).omit({
  id: true,
});

export const vocabularyRequestSchema = z.object({
  level: z.string().default("B1-C1"),
  numWords: z.number().min(1).max(20).default(10),
  excludeWords: z.array(z.string()).optional().default([]),
  anonymousId: z.string().optional(),
  topics: z.array(z.string()).optional().default(["lenny"]),
});

export const insertSavedWordSchema = createInsertSchema(savedWords).omit({
  id: true,
  createdAt: true,
});

export const savedWordsQuerySchema = z.object({
  anonymousId: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VocabularyWord = typeof vocabularyWords.$inferSelect;
export type InsertVocabularyWord = z.infer<typeof insertVocabularyWordSchema>;
export type VocabularyRequest = z.infer<typeof vocabularyRequestSchema>;
export type SavedWord = typeof savedWords.$inferSelect;
export type InsertSavedWord = z.infer<typeof insertSavedWordSchema>;
