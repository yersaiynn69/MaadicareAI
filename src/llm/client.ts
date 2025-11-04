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

export async function chat(messages: Message[]): Promise<string> {
  if (!cfg.gemini.apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  try {
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
    
    console.log(`📤 Sending to Gemini: ${cfg.gemini.model}`);
    
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
      console.error(`❌ Gemini API Error: ${res.status} - ${errorText}`);
      throw new Error(`Gemini API HTTP ${res.status}: ${errorText}`);
    }

    const data: any = await res.json();
    
    // Parse Gemini response
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("❌ No content in Gemini response:", JSON.stringify(data, null, 2));
      throw new Error("No content in Gemini response");
    }

    return content;
  } catch (error: any) {
    console.error("❌ LLM Client Error:", error.message);
    throw error;
  }
}

