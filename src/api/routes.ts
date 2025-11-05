import { Router, Request, Response } from "express";
import { Sessions } from "../sessions/memoryStore";
import { chat } from "../llm/client";
import { SYSTEM_PROMPT_RU, SYSTEM_PROMPT_KK } from "../llm/prompts/system";
import { extractAndValidateJSON } from "../utils/json";
import { Language } from "../types";

export const api = Router();

/**
 * POST /ai/message
 * Handle both initialization and message exchanges
 */
api.post("/ai/message", async (req: Request, res: Response) => {
  try {
    const { sessionId, type, fio, lang, message, imageUrl, imageBase64, imageMimeType } = req.body || {};

    // Validate sessionId
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    // Handle initialization
    if (type === "init") {
      if (!fio) {
        return res.status(400).json({ error: "fio is required for init" });
      }

      const userLang: Language = lang === "kk" ? "kk" : "ru";
      const systemPrompt = userLang === "kk" ? SYSTEM_PROMPT_KK : SYSTEM_PROMPT_RU;

      // Create new session
      Sessions.set(sessionId, {
        fio: fio,
        lang: userLang,
        messages: [{ role: "system", content: systemPrompt }],
      });

      // Generate greeting
      const greet =
        userLang === "kk"
          ? `Қайырлы күн, ${fio}! Қалай көмектесе аламын?`
          : `Доброго времени суток, ${fio}! Чем могу вам помочь?`;

      const session = Sessions.get(sessionId)!;
      session.messages.push({ role: "assistant", content: greet });

      console.log(`✅ Session ${sessionId} initialized for ${fio} (${userLang})`);

      return res.json({ reply: greet });
    }

    // Handle regular message
    if (type === "message") {
      const session = Sessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found. Please initialize first." });
      }

      const { imageBase64, imageMimeType } = req.body || {};

      // Build user message content
      const contentParts: any[] = [];

      if (message) {
        contentParts.push({ type: "text", text: message });
      }

      // Handle base64 image (preferred method)
      if (imageBase64 && imageMimeType) {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: `data:${imageMimeType};base64,${imageBase64}`,
          },
        });
        console.log(`📷 Image received: ${imageMimeType}, size: ${imageBase64.length} chars`);
      } else if (imageUrl) {
        // Fallback to URL (deprecated)
        contentParts.push({
          type: "text",
          text: `Изображение доступно по URL: ${imageUrl}. Опиши видимые признаки объективно, не ставя точного диагноза.`,
        });
      }

      if (contentParts.length === 0) {
        return res.status(400).json({ error: "message or image is required" });
      }

      // Add user message to history
      session.messages.push({
        role: "user",
        content: contentParts.length === 1 ? contentParts[0].text : contentParts,
      });

      // Get LLM response with better error handling
      let reply: string;
      try {
        reply = await chat(session.messages);
      } catch (error: any) {
        // Remove the last user message if AI failed (to avoid state inconsistency)
        if (session.messages.length > 0 && session.messages[session.messages.length - 1].role === "user") {
          session.messages.pop();
        }
        
        const errorMessage = 
          session.lang === "kk"
            ? "Кешіріңіз, AI сервисіне қосылу мүмкін болмады. Қайталап көріңіз немесе дәрігерге хабарласыңыз."
            : "Извините, не удалось связаться с AI сервисом. Попробуйте еще раз или обратитесь к врачу.";
        
        console.error("❌ Error in /ai/message:", error);
        return res.status(500).json({ 
          error: errorMessage,
          details: error.message 
        });
      }

      // Add assistant response to history
      session.messages.push({ role: "assistant", content: reply });

      console.log(`✅ Message processed for session ${sessionId}`);

      // Return reply as-is (AI already adds disclaimer if needed)
      return res.json({ reply: reply });
    }

    return res.status(400).json({ error: "type must be 'init' or 'message'" });
  } catch (error: any) {
    console.error("❌ Error in /ai/message:", error);
    return res.status(500).json({ 
      error: "Извините, сервис временно недоступен. Попробуйте позже.",
      details: error.message 
    });
  }
});

/**
 * POST /ai/finalize
 * Handle conversation finalization with satisfaction check
 */
api.post("/ai/finalize", async (req: Request, res: Response) => {
  try {
    const { sessionId, satisfaction } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = Sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!satisfaction || (satisfaction !== "yes" && satisfaction !== "no")) {
      return res.status(400).json({ error: "satisfaction must be 'yes' or 'no'" });
    }

    // Handle dissatisfaction - handoff to operator
    if (satisfaction === "no") {
      const prompt = `finalize: false, satisfaction: "no"`;
      session.messages.push({ role: "user", content: prompt });

      const llmResponse = await chat(session.messages);
      const json = extractAndValidateJSON(llmResponse, "handoff");

      console.log(`✅ Handoff to operator for session ${sessionId}`);

      return res.type("application/json").json(json);
    }

    // Handle satisfaction - make referral
    if (satisfaction === "yes") {
      const prompt = `finalize: true, satisfaction: "yes", fio: "${session.fio}"`;
      session.messages.push({ role: "user", content: prompt });

      const llmResponse = await chat(session.messages);
      const json = extractAndValidateJSON(llmResponse, "referral");

      console.log(`✅ Referral created for session ${sessionId}:`, json);

      return res.type("application/json").json(json);
    }
  } catch (error: any) {
    console.error("❌ Error in /ai/finalize:", error);
    return res.status(500).json({
      error: "Ошибка финализации. Пожалуйста, попробуйте снова.",
      details: error.message,
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
api.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    sessions: Sessions.count(),
  });
});

