import fetch from "node-fetch";
import { cfg } from "../config";
import { Message } from "../types";

export async function chat(messages: Message[]): Promise<string> {
  if (!cfg.openai.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  try {
    const res = await fetch(`${cfg.openai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.openai.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.openai.model,
        messages,
        temperature: cfg.openai.temperature,
      }),
      timeout: cfg.timeouts.responseMs,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`LLM HTTP ${res.status}: ${errorText}`);
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in LLM response");
    }

    return content;
  } catch (error: any) {
    console.error("❌ LLM Client Error:", error.message);
    throw error;
  }
}

