import fetch from "node-fetch";
import { cfg } from "../config";
import { Message } from "../types";

/**
 * Convert OpenAI-style messages to Gemini format
 */
function convertMessagesToGemini(messages: Message[]): any[] {
  const contents: any[] = [];
  
  for (const msg of messages) {
    // Skip system messages - Gemini doesn't have system role
    // We'll add system prompt as first user message if needed
    if (msg.role === "system") {
      continue;
    }
    
    const role = msg.role === "assistant" ? "model" : "user";
    const parts = [];
    
    if (typeof msg.content === "string") {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      // Handle array content (for images, etc.)
      for (const part of msg.content) {
        if (part.type === "text") {
          parts.push({ text: part.text });
        }
      }
    }
    
    if (parts.length > 0) {
      contents.push({
        role,
        parts,
      });
    }
  }
  
  return contents;
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function chat(messages: Message[]): Promise<string> {
  if (!cfg.gemini.apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // Convert messages to Gemini format
  const contents = convertMessagesToGemini(messages);
  
  // Extract system prompt if exists
  const systemPrompt = messages.find(m => m.role === "system")?.content as string;
  
  // Build request body
  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: cfg.gemini.temperature,
      maxOutputTokens: 2048,
    },
  };
  
  // Add system instruction if we have system prompt
  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const url = `${cfg.gemini.baseUrl}/models/${cfg.gemini.model}:generateContent?key=${cfg.gemini.apiKey}`;
  
  // Retry logic
  let lastError: any;
  const maxAttempts = cfg.timeouts.retryAttempts;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        const delay = cfg.timeouts.retryDelayMs * attempt; // Exponential backoff
        console.log(`🔄 Retry attempt ${attempt}/${maxAttempts} after ${delay}ms...`);
        await sleep(delay);
      }
      
      console.log(`📤 Sending to Gemini: ${cfg.gemini.model} (attempt ${attempt}/${maxAttempts})`);
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        timeout: cfg.timeouts.responseMs,
      } as any);

      if (!res.ok) {
        const errorText = await res.text();
        const error = new Error(`Gemini API HTTP ${res.status}: ${errorText}`);
        
        // Don't retry on 4xx errors (client errors)
        if (res.status >= 400 && res.status < 500) {
          console.error(`❌ Gemini API Client Error: ${res.status} - ${errorText}`);
          throw error;
        }
        
        // Retry on 5xx errors (server errors)
        lastError = error;
        console.warn(`⚠️  Gemini API Server Error: ${res.status} - will retry`);
        continue;
      }

      const data: any = await res.json();
      
      // Parse Gemini response
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        // Check for blocking reasons
        if (data.candidates?.[0]?.finishReason === "SAFETY") {
          throw new Error("Response blocked by safety filters");
        }
        
        console.error("❌ No content in Gemini response:", JSON.stringify(data, null, 2));
        
        // Only retry if it's not a blocking/safety issue
        if (attempt < maxAttempts) {
          lastError = new Error("No content in Gemini response");
          continue;
        }
        
        throw new Error("No content in Gemini response");
      }

      console.log(`✅ Gemini response received (attempt ${attempt})`);
      return content;
      
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on timeout if it's the last attempt
      if (error.type === "request-timeout" || error.message?.includes("timeout")) {
        console.warn(`⏱️  Request timeout (attempt ${attempt}/${maxAttempts})`);
        if (attempt < maxAttempts) {
          continue;
        }
      }
      
      // Don't retry on configuration errors
      if (error.message?.includes("GEMINI_API_KEY") || error.message?.includes("configured")) {
        console.error("❌ Configuration Error:", error.message);
        throw error;
      }
      
      // For other errors, retry if we have attempts left
      if (attempt < maxAttempts) {
        console.warn(`⚠️  Error (attempt ${attempt}/${maxAttempts}):`, error.message);
        continue;
      }
      
      // Last attempt failed
      console.error("❌ LLM Client Error (all attempts failed):", error.message);
      throw error;
    }
  }
  
  // All retries exhausted
  console.error("❌ All retry attempts exhausted");
  throw lastError || new Error("Failed to get response from Gemini API");
}

