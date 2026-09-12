/**
 * LLM Service — Multi-Provider AI Helper
 *
 * Supports NVIDIA API (OpenAI-compatible) and OpenRouter.
 * Always validates the model output against a zod schema and retries before failing.
 */

import { z } from "zod/v4";
import { delay } from "@/lib/utils";

// ─── Provider Configuration ────────────────────────────────────

interface LLMProvider {
  baseUrl: string;
  apiKey: string;
  model: string;
}

function getProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || "nvidia";

  if (provider === "nvidia") {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error("NVIDIA_API_KEY not configured");
    return {
      baseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
      apiKey,
      model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b",
    };
  }

  // Fallback to OpenRouter
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
  return {
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey,
    model: process.env.OPENROUTER_MODEL || "google/gemini-3.6-flash",
  };
}

export function getModel(): string {
  return getProvider().model;
}

/**
 * Extract the first JSON object from a model response, tolerating
 * markdown code fences and surrounding prose.
 */
export function extractJson(text: string): string {
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();

  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error(
      `No JSON object found in LLM output (len=${t.length}). Content: ${JSON.stringify(t.slice(0, 1500))}`
    );
  }
  return t.slice(start, end + 1);
}

/**
 * Escape control characters (newlines, tabs) that appear inside JSON
 * string literals so that JSON.parse can handle models that emit raw
 * line breaks in string values.
 */
function sanitizeJson(raw: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of raw) {
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        out += ch;
        inString = false;
        continue;
      }
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\r") {
        out += "\\r";
        continue;
      }
      if (ch === "\t") {
        out += "\\t";
        continue;
      }
      out += ch;
    } else {
      if (ch === '"') {
        inString = true;
        out += ch;
        continue;
      }
      out += ch;
    }
  }
  return out;
}

interface CallLLMOptions<T> {
  prompt: string;
  schema: z.ZodType<T>;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  attempts?: number;
}

export async function callLLM<T>(opts: CallLLMOptions<T>): Promise<T> {
  const provider = getProvider();
  const attempts = opts.attempts ?? 3;
  let lastError: unknown = new Error("LLM call failed");

  for (let i = 0; i < attempts; i++) {
    try {
      const jsonInstruction = "CRITICAL: Respond with ONLY the final answer. No thinking process, no analysis, no step-by-step breakdown, no markdown. Output the raw answer directly.";
      const systemMsg = opts.system
        ? `${opts.system}\n\n${jsonInstruction}`
        : jsonInstruction;

      const res = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
          ...(process.env.LLM_PROVIDER !== "nvidia"
            ? {
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                "X-Title": "LeadIntel AI Pipeline",
              }
            : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: opts.prompt },
          ],
          temperature: opts.temperature ?? 0.2,
          max_tokens: opts.maxTokens ?? 4096,
        }),
        signal: AbortSignal.timeout(150_000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`LLM API error (${res.status}): ${errText.slice(0, 300)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content as string | undefined;
      if (!content) {
        throw new Error(
          `LLM returned empty content. API: ${JSON.stringify(data).slice(0, 300)}`
        );
      }

      const parsed = JSON.parse(sanitizeJson(extractJson(content)));
      const result = opts.schema.safeParse(parsed);
      if (result.success) return result.data;

      lastError = new Error(
        `Schema validation failed: ${JSON.stringify(result.error.issues.slice(0, 3))}`
      );
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await delay(3000);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("LLM call failed");
}

/**
 * Free-form LLM call (no schema validation) for conversations
 */
export async function callLLMFreeform(opts: {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const provider = getProvider();

  const thinkingInstruction = "CRITICAL: Do NOT output any thinking process, analysis, or step-by-step reasoning. Output ONLY your final response directly.";
  const systemPrompt = opts.system
    ? `${opts.system}\n\n${thinkingInstruction}`
    : thinkingInstruction;

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
      ...(process.env.LLM_PROVIDER !== "nvidia"
        ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "LeadIntel AI Pipeline",
          }
        : {}),
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: opts.prompt },
      ],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    }),
    signal: AbortSignal.timeout(150_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`LLM API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  let content = data.choices?.[0]?.message?.content as string | undefined;
  if (!content) {
    throw new Error("LLM returned empty content");
  }

  // Strip thinking content if present (model sometimes outputs thinking process)
  content = stripThinkingContent(content);

  return content;
}

/**
 * Strip thinking/reasoning content from LLM response
 * NVIDIA nemotron outputs thinking process by default.
 * This extracts the actual useful response.
 */
function stripThinkingContent(content: string): string {
  // Strategy 1: Look for a clean question or sentence (agent dialogue)
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty, bullet points, numbered lists, thinking markers
    if (
      trimmed === "" ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("*") ||
      trimmed.match(/^\d+\./) ||
      trimmed.includes("**") ||
      trimmed.startsWith("Here") ||
      trimmed.startsWith("Let me") ||
      trimmed.startsWith("I need") ||
      trimmed.startsWith("I should") ||
      trimmed.startsWith("The ") ||
      trimmed.startsWith("User ") ||
      trimmed.startsWith("Context:")
    ) continue;

    // Good candidate: ends with ? or is a complete sentence
    if (trimmed.endsWith("?") && trimmed.length > 10) return trimmed;
    if (trimmed.endsWith(".") && trimmed.length > 15 && !trimmed.includes(":")) return trimmed;
    if (trimmed.endsWith("!") && trimmed.length > 10) return trimmed;
  }

  // Strategy 2: Find quoted dialogue
  const quotes = content.match(/"([^"]{10,})"/g);
  if (quotes && quotes.length > 0) {
    const longestQuote = quotes.reduce((a, b) => (a.length > b.length ? a : b));
    return longestQuote.slice(1, -1);
  }

  // Strategy 3: JSON extraction
  const jsonStart = content.indexOf("{");
  if (jsonStart >= 0) {
    const jsonEnd = content.lastIndexOf("}");
    if (jsonEnd > jsonStart) {
      return content.slice(jsonStart, jsonEnd + 1);
    }
  }

  // Strategy 4: Find the last non-thinking line
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (
      trimmed.length > 10 &&
      !trimmed.startsWith("-") &&
      !trimmed.startsWith("*") &&
      !trimmed.match(/^\d+\./) &&
      !trimmed.includes("**")
    ) {
      return trimmed;
    }
  }

  return content;
}
