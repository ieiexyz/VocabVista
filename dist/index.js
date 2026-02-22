var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/services/gemini.ts
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
});
var LENNY_VOCAB_PATH = path.join(import.meta.dirname, "..", "data", "lenny-vocabulary.json");
var lennyVocabularyCache = null;
function getLennyVocabulary() {
  if (lennyVocabularyCache !== null) return lennyVocabularyCache;
  try {
    if (fs.existsSync(LENNY_VOCAB_PATH)) {
      const raw = fs.readFileSync(LENNY_VOCAB_PATH, "utf-8");
      const list = JSON.parse(raw);
      lennyVocabularyCache = Array.isArray(list) ? list : [];
    } else {
      lennyVocabularyCache = [];
    }
  } catch {
    lennyVocabularyCache = [];
  }
  return lennyVocabularyCache;
}
function sampleFromLenny(count, excludeWords) {
  const list = getLennyVocabulary();
  const excludeSet = new Set(excludeWords.map((w) => w.toLowerCase()));
  const pool2 = list.filter((e) => !excludeSet.has(e.word.toLowerCase()));
  if (pool2.length === 0 || count <= 0) return [];
  const shuffled = [...pool2].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
async function generateVocabulary(level = "B1-C1", numWords = 10, excludeWords = []) {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required");
  }
  const excludeWordsText = excludeWords.length > 0 ? ` Do not include these words: ${excludeWords.join(", ")}.` : "";
  const lennyCount = numWords >= 10 ? 3 : numWords >= 6 ? 2 : 1;
  const b1b2Count = numWords >= 8 ? 2 : 1;
  const b2c1Count = numWords >= 8 ? 3 : numWords >= 6 ? 2 : 1;
  const lennySamples = sampleFromLenny(lennyCount, excludeWords);
  const additionalCount = numWords - lennySamples.length;
  let prompt;
  if (lennySamples.length > 0 && additionalCount > 0) {
    const lennyBlock = lennySamples.map((e) => `- word: "${e.word}", sentence: "${e.sentence.replace(/"/g, '\\"')}"`).join("\n");
    prompt = `You must output exactly ${numWords} words in the "words" JSON array.

Part 1 - From Lenny's Podcast (include these first, in order): For each item below, add "pronunciation" (KK Phonetic Symbol) and "definition" (English). Keep "word" and "sentence" exactly as given.
${lennyBlock}

Part 2 - Generate ${additionalCount} more words: Each with word, pronunciation (KK), definition, and sentence. Level ${level}. Include at least ${b1b2Count} word(s) B1-B2 and at least ${b2c1Count} word(s) B2 or C1. At least 2 words must be commonly used in annual performance reviews or appraisals (e.g. performance review, appraisal, KPI, OKR, promotion); use example sentences that sound like real manager-employee evaluation conversations.${excludeWordsText}

Output format: JSON object with single key "words", value an array of ${numWords} objects each with keys: word, pronunciation, definition, sentence. No extra text or code block.`;
  } else if (lennySamples.length > 0 && additionalCount <= 0) {
    const lennyBlock = lennySamples.map((e) => `- word: "${e.word}", sentence: "${e.sentence.replace(/"/g, '\\"')}"`).join("\n");
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
                  sentence: { type: "string" }
                },
                required: ["word", "pronunciation", "definition", "sentence"]
              }
            }
          },
          required: ["words"]
        }
      },
      contents: prompt
    });
    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }
    const data = JSON.parse(rawJson);
    if (!data.words || !Array.isArray(data.words)) {
      throw new Error("Invalid response format from Gemini API");
    }
    return data.words.map((item) => ({
      word: item.word || "N/A",
      pronunciation: item.pronunciation || "N/A",
      definition: item.definition || "N/A",
      sentence: item.sentence || "N/A",
      level
    }));
  } catch (error) {
    console.error("Error generating vocabulary:", error);
    throw new Error(
      `Failed to generate vocabulary: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// server/db.ts
import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertSavedWordSchema: () => insertSavedWordSchema,
  insertUserSchema: () => insertUserSchema,
  insertVocabularyWordSchema: () => insertVocabularyWordSchema,
  savedWords: () => savedWords,
  savedWordsQuerySchema: () => savedWordsQuerySchema,
  users: () => users,
  vocabularyRequestSchema: () => vocabularyRequestSchema,
  vocabularyWords: () => vocabularyWords
});
import { pgTable, text, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var vocabularyWords = pgTable("vocabulary_words", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  pronunciation: text("pronunciation").notNull(),
  definition: text("definition").notNull(),
  sentence: text("sentence").notNull(),
  level: text("level").notNull().default("B1-C1")
});
var savedWords = pgTable(
  "saved_words",
  {
    id: serial("id").primaryKey(),
    // TODO: 將來若有正式登入系統，可改為 references(users.id)
    anonymousId: text("anonymous_id").notNull(),
    vocabularyWordId: integer("vocabulary_word_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: false }).notNull().defaultNow()
  },
  (table) => ({
    // 同一個使用者對同一個單字只會有一筆收藏紀錄
    uniqueSavedWordPerUser: uniqueIndex("saved_words_anonymous_word_unique").on(
      table.anonymousId,
      table.vocabularyWordId
    )
  })
);
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertVocabularyWordSchema = createInsertSchema(vocabularyWords).omit({
  id: true
});
var vocabularyRequestSchema = z.object({
  level: z.string().default("B1-C1"),
  numWords: z.number().min(1).max(20).default(10),
  excludeWords: z.array(z.string()).optional().default([]),
  anonymousId: z.string().optional()
});
var insertSavedWordSchema = createInsertSchema(savedWords).omit({
  id: true,
  createdAt: true
});
var savedWordsQuerySchema = z.object({
  anonymousId: z.string().min(1)
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/routes.ts
import { eq } from "drizzle-orm";
async function registerRoutes(app2) {
  app2.get("/api/debug/db", async (_req, res) => {
    try {
      const result = await db.execute("SELECT COUNT(*) as cnt FROM vocabulary_words");
      res.json({
        ok: true,
        buildTime: (/* @__PURE__ */ new Date()).toISOString(),
        dbUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 40) + "..." : "NOT SET",
        vocabularyWordsCount: result.rows[0]
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });
  app2.post("/api/vocabulary/generate", async (req, res) => {
    try {
      const { level, numWords, excludeWords, anonymousId } = vocabularyRequestSchema.parse(req.body);
      let mergedExcludeWords = [...excludeWords ?? []];
      if (anonymousId) {
        const saved = await db.select({ word: vocabularyWords.word }).from(savedWords).innerJoin(vocabularyWords, eq(savedWords.vocabularyWordId, vocabularyWords.id)).where(eq(savedWords.anonymousId, anonymousId));
        const savedWordStrings = saved.map((r) => r.word);
        const excludeSet = new Set(mergedExcludeWords.map((w) => w.toLowerCase()));
        for (const w of savedWordStrings) {
          if (!excludeSet.has(w.toLowerCase())) {
            excludeSet.add(w.toLowerCase());
            mergedExcludeWords.push(w);
          }
        }
      }
      const vocabularyRaw = await generateVocabulary(level, numWords, mergedExcludeWords);
      const normalizeWord = (w) => w.charAt(0).toLowerCase() + w.slice(1);
      const excludeSetFinal = new Set(mergedExcludeWords.map((w) => w.toLowerCase()));
      const vocabulary = vocabularyRaw.filter(
        (v) => !excludeSetFinal.has(normalizeWord(v.word).toLowerCase())
      );
      const rowsToInsert = vocabulary.map((v) => ({
        word: normalizeWord(v.word),
        pronunciation: v.pronunciation,
        definition: v.definition,
        sentence: v.sentence,
        level: v.level ?? level
      }));
      const inserted = await db.insert(vocabularyWords).values(rowsToInsert).returning();
      res.json({
        success: true,
        data: inserted
      });
    } catch (error) {
      console.error("Error in vocabulary generation:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate vocabulary"
      });
    }
  });
  app2.get("/api/saved-words", async (req, res) => {
    try {
      const { anonymousId } = savedWordsQuerySchema.parse(req.query);
      const rows = await db.select({
        id: savedWords.id,
        anonymousId: savedWords.anonymousId,
        createdAt: savedWords.createdAt,
        wordId: vocabularyWords.id,
        word: vocabularyWords.word,
        pronunciation: vocabularyWords.pronunciation,
        definition: vocabularyWords.definition,
        sentence: vocabularyWords.sentence,
        level: vocabularyWords.level
      }).from(savedWords).leftJoin(
        vocabularyWords,
        eq(savedWords.vocabularyWordId, vocabularyWords.id)
      ).where(eq(savedWords.anonymousId, anonymousId));
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error("Error fetching saved words:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch saved words"
      });
    }
  });
  app2.post("/api/saved-words", async (req, res) => {
    try {
      const payload = insertSavedWordSchema.parse(req.body);
      const [inserted] = await db.insert(savedWords).values(payload).onConflictDoNothing().returning();
      res.status(201).json({
        success: true,
        data: inserted ?? null
      });
    } catch (error) {
      console.error("Error inserting saved word:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to save word"
      });
    }
  });
  app2.delete("/api/saved-words/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid id"
        });
      }
      await db.delete(savedWords).where(eq(savedWords.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting saved word:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete saved word"
      });
    }
  });
  app2.delete("/api/saved-words", async (req, res) => {
    try {
      const { anonymousId } = savedWordsQuerySchema.parse(req.query);
      await db.delete(savedWords).where(eq(savedWords.anonymousId, anonymousId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing saved words:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to clear saved words"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var isReplit = process.env.REPL_ID !== void 0;
var vite_config_default = defineConfig({
  plugins: [
    react(),
    // 僅在 Replit 環境啟用 Replit 的錯誤遮罩與地圖外掛，避免在本機開發被第三方 UI 影響
    ...isReplit ? [runtimeErrorOverlay()] : [],
    ...process.env.NODE_ENV !== "production" && isReplit ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    // 關閉 Vite 內建的瀏覽器錯誤遮罩，只保留 console 錯誤訊息
    hmr: {
      overlay: false
    },
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = Number(process.env.PORT) || 5e3;
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
  server.listen(
    {
      port,
      host
    },
    () => {
      log(`serving on http://${host}:${port}`);
    }
  );
})();
