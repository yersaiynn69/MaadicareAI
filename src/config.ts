import { Language } from "./types";

export const cfg = {
  port: parseInt(process.env.PORT || "3001", 10),
  openai: {
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
  },
  timeouts: {
    responseMs: parseInt(process.env.RESPONSE_TIMEOUT_MS || "15000", 10),
  },
  limits: {
    maxHistoryTokens: parseInt(process.env.MAX_HISTORY_TOKENS || "8000", 10),
  },
  langDefault: (process.env.LANG_DEFAULT || "ru") as Language,
};

// Validate required config
if (!cfg.openai.apiKey) {
  console.warn("⚠️  OPENAI_API_KEY is not set. Please set it in .env file.");
}

