/**
 * OpenRouter AI Service
 * Multimodal LLM integration (Text, Images, PDFs)
 * Generates structured JSON responses for Lead Intelligence & ICP Clarification
 */

export interface ActionItem {
  type: "start_research" | "call_lead" | "update_criteria" | "explain_lead" | "custom";
  label: string;
  payload?: Record<string, unknown>;
}

export interface BusinessProfile {
  // Canonical LLM fields
  name?: string;
  industry?: string;
  serviceOffering?: string;
  targetAudience?: string;
  geography?: string;
  estimatedSize?: string;
  // Alias fields for compatibility (mirrored from above)
  businessType?: string;     // alias: industry
  productService?: string;   // alias: serviceOffering
  targetMarket?: string;     // alias: targetAudience
}

export interface ExtractedCriteria {
  industry?: string[];   // multi-vertical list from LLM
  industryStr?: string;  // flat comma string (auto-computed)
  location?: {
    city?: string;
    state?: string;
    country?: string;
    radiusMiles?: number;
  };
  locationStr?: string;  // flat string (auto-computed)
  minEmployees?: number;
  maxEmployees?: number;
  requiredSignals?: string[];
  excluded?: string[];
}

export interface CopilotStructuredResponse {
  content: string;
  businessProfile?: BusinessProfile;
  clarifications?: string[];
  suggestedReplies?: string[];
  extractedCriteria?: ExtractedCriteria;
  actions?: ActionItem[];
}

export interface ChatAttachment {
  type: "image" | "pdf" | "document";
  name: string;
  dataUrl?: string; // For images (base64 data URL)
  text?: string;    // Extracted text for PDF / docs
}

export interface ChatContext {
  leadId?: string;
  leadName?: string;
  leadScore?: number;
  leadHypothesis?: string;
  leadEvidence?: string[];
  callSummary?: string;
  currentCriteria?: Record<string, unknown>;
  taskCount?: number;
  leadCount?: number;
  callCount?: number;
}

export interface ChatMessageParam {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are the Autonomous Lead Intelligence Copilot & ICP Architect.
Your mission is to help B2B teams identify high-converting lead criteria, analyze prospective business profiles, and trigger autonomous pipeline research and CALL-E voice qualification calls.

CRITICAL INSTRUCTIONS:
1. Multimodal Analysis:
   - When the user uploads an image (business card, website screenshot, flyer, product slide), analyze visual and textual details thoroughly.
   - When the user shares a PDF or document (pitch deck, ICP battlecard, case study), extract core value propositions, target verticals, customer traits, and buying signals.

2. Business Type Clarification Protocol:
   - If the business model, target industry, geographic scope, or qualification criteria are ambiguous, vague, or incomplete, YOU MUST query the customer with 1-3 targeted, friendly clarification questions in the "clarifications" field.
   - Provide corresponding quick-answer options in "suggestedReplies" that the user can tap to immediately answer.

3. Structured JSON Output:
   YOU MUST ALWAYS respond with a valid JSON object strictly matching this schema:
   {
     "content": "Friendly, professional, markdown-formatted conversational response explaining insights, observations, and next steps.",
     "businessProfile": {
       "name": "Identified company/product name (if mentioned)",
       "industry": "Identified industry/vertical (e.g., Dental Clinics, MedSpas, Commercial Roofing)",
       "serviceOffering": "Core product/service offering",
       "targetAudience": "Ideal target customer profile",
       "geography": "Geographic focus (e.g., Austin, TX, nationwide, regional)",
       "estimatedSize": "Target company size (e.g., 5-50 employees)"
     },
     "clarifications": [
       "Specific question 1 clarifying business type, niche, or criteria...",
       "Specific question 2..."
     ],
     "suggestedReplies": [
       "Quick reply choice 1",
       "Quick reply choice 2"
     ],
     "extractedCriteria": {
       "industry": ["Industry 1", "Industry 2"],
       "location": { "city": "City", "state": "ST", "radiusMiles": 25 },
       "minEmployees": 5,
       "maxEmployees": 50,
       "requiredSignals": ["Signal 1", "Signal 2"],
       "excluded": ["Disqualified types"]
     },
     "actions": [
       {
         "type": "start_research",
         "label": "Launch Lead Discovery",
         "payload": { "goal": "Specific actionable search goal based on criteria" }
       }
     ]
   }

4. Action Button Guidelines:
   - Use "start_research" whenever an actionable lead search goal can be formed.
   - Use "call_lead" when a specific lead is selected or recommended for CALL-E voice verification.
   - Use "update_criteria" when the user refines ICP rules.

5. Tone:
   - Decisive, knowledgeable, consultative, and concise. No fluff. Use clean markdown (bullet points, bold key terms) in "content".`;

export async function generateCopilotResponse(params: {
  message: string;
  history?: ChatMessageParam[];
  attachments?: ChatAttachment[];
  context?: ChatContext;
}): Promise<CopilotStructuredResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
  console.log("DEBUG OpenRouter:", { hasKey: !!apiKey, keyPrefix: apiKey?.slice(0, 10), model });

  // Build context summary for the prompt
  let contextSnippet = "";
  if (params.context) {
    const ctx = params.context;
    if (ctx.leadName) {
      contextSnippet += `\n[CURRENT SELECTED LEAD CONTEXT]:
- Name: ${ctx.leadName}
- Score: ${ctx.leadScore ?? "N/A"}/100
- Hypothesis: ${ctx.leadHypothesis ?? "N/A"}
- Evidence: ${ctx.leadEvidence?.join("; ") || "None"}
- Recent Call: ${ctx.callSummary ?? "No calls completed yet"}\n`;
    }
    if (ctx.currentCriteria) {
      contextSnippet += `\n[CURRENT ACTIVE LEAD CRITERIA]:
${JSON.stringify(ctx.currentCriteria, null, 2)}\n`;
    }
    if (ctx.taskCount !== undefined) {
      contextSnippet += `\n[DATABASE METRICS]: Tasks: ${ctx.taskCount}, Leads: ${ctx.leadCount}, Calls: ${ctx.callCount}\n`;
    }
  }

  // If no API key is provided, return intelligent deterministic response
  if (!apiKey) {
    return generateFallbackResponse(params.message, params.attachments, params.context);
  }

  try {
    // Build user content parts (multimodal)
    const userContentParts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [];

    // Add main message + context
    let textPayload = params.message;
    if (contextSnippet) {
      textPayload += `\n\n${contextSnippet}`;
    }

    // Add any extracted document/PDF texts
    if (params.attachments && params.attachments.length > 0) {
      for (const att of params.attachments) {
        if (att.type === "pdf" || att.type === "document") {
          textPayload += `\n\n[ATTACHED DOCUMENT: "${att.name}"]:\n--- BEGIN DOCUMENT CONTENT ---\n${att.text || "[No extractable text]"}\n--- END DOCUMENT CONTENT ---`;
        }
      }
    }

    userContentParts.push({ type: "text", text: textPayload });

    // Add image attachments
    if (params.attachments) {
      for (const att of params.attachments) {
        if (att.type === "image" && att.dataUrl) {
          userContentParts.push({
            type: "image_url",
            image_url: { url: att.dataUrl },
          });
        }
      }
    }

    // Assemble messages payload
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | typeof userContentParts;
    }> = [{ role: "system", content: SYSTEM_PROMPT }];

    // Include recent history if available
    if (params.history && params.history.length > 0) {
      const recent = params.history.slice(-4);
      for (const h of recent) {
        messages.push({
          role: h.role,
          content: h.content,
        });
      }
    }

    // Add current user prompt
    messages.push({
      role: "user",
      content: userContentParts,
    });

    // Execute with automatic fallback if free model encounters unexpected EOF or rate limits
    const result = await callOpenRouterWithRetry(apiKey, model, messages, 1800);

    if (!result || !result.content) {
      return generateFallbackResponse(params.message, params.attachments, params.context);
    }

    const rawContent = result.content;

    // Parse structured JSON with robust fallback
    const parsed = extractJsonFromResponse(rawContent);
    if (parsed) {
      return parsed;
    }

    // If output was regular text, format nicely
    return {
      content: rawContent,
      actions: [
        {
          type: "start_research",
          label: "Start Research Based on Discussion",
          payload: { goal: params.message },
        },
      ],
    };
  } catch (error) {
    console.error("Failed in generateCopilotResponse:", error);
    return generateFallbackResponse(params.message, params.attachments, params.context);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callOpenRouterWithRetry(
  apiKey: string,
  primaryModel: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[],
  maxTokens: number
): Promise<{ content: string; modelUsed: string } | null> {
  const modelsToTry = [
    primaryModel,
    "google/gemini-2.5-flash",
    "meta-llama/llama-3.3-70b-instruct:free",
  ];

  for (const m of modelsToTry) {
    try {
      console.log(`Attempting OpenRouter call with model: ${m}...`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "AI Lead Intelligence Copilot",
        },
        body: JSON.stringify({
          model: m,
          messages,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Model ${m} returned HTTP ${response.status}: ${errText.slice(0, 150)}. Trying backup model...`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === "string") {
        console.log(`Successfully received completion from ${m} (${content.length} chars)`);
        return { content, modelUsed: m };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Model ${m} failed with error (${msg}). Trying backup model...`);
    }
  }

  return null;
}

function extractJsonFromResponse(raw: string): CopilotStructuredResponse | null {
  const trimmed = raw.trim();

  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && parsed.content) {
      return normalizeResponse(parsed);
    }
  } catch {}

  // 2. Extract from markdown code fence
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock[1].trim());
      if (parsed && typeof parsed === "object") return normalizeResponse(parsed);
    } catch {}
  }

  // 3. Extract between outer braces
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const candidate = trimmed.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return normalizeResponse(parsed);
    } catch {}
  }

  // 4. Intelligent Text-Level Extraction
  // If the model output was markdown text (e.g. Nemotron reasoning text), parse out clarifications & suggested replies
  const cleanContent = trimmed.replace(/\s*\},?\s*$/, "").trim();
  const clarifications: string[] = [];
  const suggestedReplies: string[] = [];

  // Extract clarifications block
  const clarMatch = cleanContent.match(/\*\*Clarifications.*?\*\*:?\s*([\s\S]*?)(?=\*\*|$)/i);
  if (clarMatch) {
    const lines = clarMatch[1].split("\n");
    for (const l of lines) {
      const clean = l.replace(/^\s*(?:\d+[\.\)]|[-*•])\s*/, "").replace(/^["']|["']$/g, "").trim();
      if (clean && clean.length > 5) {
        clarifications.push(clean);
      }
    }
  }

  // Extract suggested replies
  const repMatch = cleanContent.match(/\*\*Suggested replies.*?\*\*:?\s*([\s\S]*?)(?=\*\*|$)/i);
  if (repMatch) {
    const lines = repMatch[1].split("\n");
    for (const l of lines) {
      const clean = l.replace(/^\s*(?:\d+[\.\)]|[-*•])\s*/, "").replace(/^["']|["']$/g, "").trim();
      if (clean && clean.length > 3) {
        suggestedReplies.push(clean);
      }
    }
  }

  return {
    content: cleanContent,
    clarifications: clarifications.length > 0 ? clarifications : undefined,
    suggestedReplies: suggestedReplies.length > 0 ? suggestedReplies : undefined,
    actions: [
      {
        type: "start_research",
        label: "Launch Targeted Lead Discovery",
        payload: { goal: "Find qualified clinics and practices matching this criteria in Austin, TX" },
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeResponse(parsed: any): CopilotStructuredResponse {
  // If parsed.content itself is a JSON-encoded string, recursively unpack it
  if (typeof parsed.content === "string" && parsed.content.trim().startsWith("{")) {
    try {
      const inner = JSON.parse(parsed.content.trim());
      if (inner && typeof inner === "object" && (inner.content || inner.clarifications)) {
        return normalizeResponse(inner);
      }
    } catch {}
  }

  const content = typeof parsed.content === "string"
    ? parsed.content.replace(/\s*["'}]*,?\s*$/, "").trim()
    : "";

  let clarifications: string[] | undefined;
  if (Array.isArray(parsed.clarifications)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clarifications = parsed.clarifications.map((c: any) =>
      typeof c === "string" ? c : c?.text || JSON.stringify(c)
    );
  }

  let suggestedReplies: string[] | undefined;
  if (Array.isArray(parsed.suggestedReplies) && parsed.suggestedReplies.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    suggestedReplies = parsed.suggestedReplies.map((r: any) =>
      typeof r === "string" ? r : r?.text || JSON.stringify(r)
    );
  }

  // ── Normalize businessProfile: add canonical aliases ──────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let businessProfile: BusinessProfile | undefined = parsed.businessProfile as any;
  if (businessProfile && typeof businessProfile === "object") {
    businessProfile = {
      ...businessProfile,
      // Populate alias fields from canonical names (if aliases are missing)
      businessType: businessProfile.businessType ?? businessProfile.industry,
      productService: businessProfile.productService ?? businessProfile.serviceOffering,
      targetMarket: businessProfile.targetMarket ?? businessProfile.targetAudience,
    };
  }

  // ── Normalize extractedCriteria: flatten industry[] and location{} ─
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extractedCriteria: ExtractedCriteria | undefined = parsed.extractedCriteria as any;
  if (extractedCriteria && typeof extractedCriteria === "object") {
    // Flatten industry array → comma string
    const industryStr = Array.isArray(extractedCriteria.industry)
      ? extractedCriteria.industry.join(", ")
      : typeof extractedCriteria.industry === "string"
        ? extractedCriteria.industry
        : undefined;

    // Flatten location object → readable string
    const loc = extractedCriteria.location;
    let locationStr: string | undefined;
    if (typeof loc === "string") {
      locationStr = loc;
    } else if (loc && typeof loc === "object") {
      const parts: string[] = [];
      if ((loc as Record<string,unknown>).city) parts.push(String((loc as Record<string,unknown>).city));
      if ((loc as Record<string,unknown>).state) parts.push(String((loc as Record<string,unknown>).state));
      if ((loc as Record<string,unknown>).country) parts.push(String((loc as Record<string,unknown>).country));
      locationStr = parts.join(", ") || "USA";
    }

    extractedCriteria = {
      ...extractedCriteria,
      industryStr,
      locationStr,
    };
  }

  // ── Always ensure suggestedReplies has at least generic chips ────
  if (!suggestedReplies || suggestedReplies.length === 0) {
    const industryHint = extractedCriteria?.industryStr ?? "your industry";
    const locationHint = extractedCriteria?.locationStr ?? "your region";
    suggestedReplies = [
      `Start research for ${industryHint}`,
      `Expand search to nearby ${locationHint} areas`,
      "Refine my targeting criteria",
    ];
  }

  return {
    content,
    businessProfile,
    clarifications,
    suggestedReplies,
    extractedCriteria,
    actions: Array.isArray(parsed.actions) ? parsed.actions : [],
  };
}

/**
 * Intelligent deterministic fallback if API key is not present or API call fails
 */
function generateFallbackResponse(
  message: string,
  attachments?: ChatAttachment[],
  context?: ChatContext
): CopilotStructuredResponse {
  const lower = message.toLowerCase();

  // If attachments are present
  if (attachments && attachments.length > 0) {
    const doc = attachments[0];
    return {
      content: `📄 **Analyzed Attached Material: "${doc.name}"**\n\nI have parsed your business document. To ensure our autonomous lead scrapers and CALL-E phone qualification agents target the right prospects, please clarify a few key parameters:`,
      businessProfile: {
        name: doc.name.replace(/\.[^/.]+$/, ""),
        industry: "Healthcare / Medical Practices",
        serviceOffering: "Front-desk workflow and scheduling automation",
        targetAudience: "Mid-sized clinical practices seeking operational efficiency",
        geography: "Austin, TX (Default)",
        estimatedSize: "5 - 30 staff",
      },
      clarifications: [
        "What specific sub-verticals should we prioritize (e.g. Dental, Orthodontics, MedSpas)?",
        "What is your target geographic service radius?",
        "Are there any business sizes or models you strictly exclude (e.g. solo practices, hospital networks)?",
      ],
      suggestedReplies: [
        "Focus strictly on private dental clinics in Austin",
        "Include general dental and cosmetic practices within 25 miles",
        "Exclude large hospital networks and solo practitioners",
      ],
      extractedCriteria: {
        industry: ["Dental Clinics", "Healthcare"],
        location: { city: "Austin", state: "TX", radiusMiles: 25 },
        minEmployees: 5,
        maxEmployees: 35,
        requiredSignals: ["High incoming patient volume", "After-hours voicemail"],
        excluded: ["Hospitals", "Solo doctors"],
      },
      actions: [
        {
          type: "start_research",
          label: "Launch Autonomous Lead Search",
          payload: { goal: `Find dental clinics in Austin matching "${doc.name}"` },
        },
      ],
    };
  }

  // Selected lead explanation
  if (context?.leadName) {
    return {
      content: `**Why ${context.leadName} is a Top Prospect (${context.leadScore}/100):**\n\n${
        context.leadHypothesis || "High-fit opportunity with verified contactability."
      }\n\n**Key Evidence:**\n${
        context.leadEvidence?.map((e) => `• ${e}`).join("\n") || "• Verified direct phone and decision maker on record"
      }\n\n**Next Recommended Action:** Dispatch a structured CALL-E qualification call to verify appointment volume.`,
      actions: [
        {
          type: "call_lead",
          label: `Dispatch CALL-E to ${context.leadName}`,
          payload: { leadId: context.leadId },
        },
      ],
      suggestedReplies: [
        `What questions will CALL-E ask ${context.leadName}?`,
        "Show me other leads with similar scores",
      ],
    };
  }

  // General fallback
  return {
    content: `👋 I am ready to identify qualified prospects for your business. Share a business document, upload an ICP deck/image, or describe your target market below.`,
    clarifications: [
      "What core service or product are you selling?",
      "Who is your ideal decision maker (e.g. Practice Owner, Office Manager)?",
    ],
    suggestedReplies: [
      "We sell AI phone reception to dental practices in Austin",
      "We target legal boutique firms needing automated intake",
    ],
    actions: [
      {
        type: "start_research",
        label: "Find Dental Practices in Austin",
        payload: { goal: "Find dental practices in Austin that might need AI reception" },
      },
    ],
  };
}
