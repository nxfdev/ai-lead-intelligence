/**
 * LLM Service — OpenRouter strict-JSON helper
 *
 * Small wrapper around the OpenRouter API used by the planning and
 * enrichment stages of the pipeline. Always validates the model output
 * against a zod schema and retries once before failing.
 */

import { z } from "zod/v4";
import { delay } from "@/lib/utils";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export function getModel(): string {
  return process.env.OPENROUTER_MODEL || "google/gemini-3.6-flash";
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
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const attempts = opts.attempts ?? 3;
  let lastError: unknown = new Error("LLM call failed");

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "LeadIntel AI Pipeline",
        },
        body: JSON.stringify({
          model: getModel(),
          messages: [
            ...(opts.system ? [{ role: "system", content: opts.system }] : []),
            { role: "user", content: opts.prompt },
          ],
          temperature: opts.temperature ?? 0.2,
          max_tokens: opts.maxTokens ?? 1400,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(150_000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`LLM API error (${res.status}): ${errText.slice(0, 200)}`);
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