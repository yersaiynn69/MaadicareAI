import { Language } from "./types";

export const cfg = {
  port: parseInt(process.env.PORT || "9000", 10),
  gemini: {
    baseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
    temperature: 0.2,
  },
  timeouts: {
    responseMs: parseInt(process.env.RESPONSE_TIMEOUT_MS || "90000", 10), // 90 seconds for slow models
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || "3", 10),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || "2000", 10),
  },
  limits: {
    maxHistoryTokens: parseInt(process.env.MAX_HISTORY_TOKENS || "80000", 10),
  },
  langDefault: (process.env.LANG_DEFAULT || "ru") as Language,
};

// Validate required config
if (!cfg.gemini.apiKey) {
  console.warn("⚠️  GEMINI_API_KEY is not set. Please set it in .env file.");
}

