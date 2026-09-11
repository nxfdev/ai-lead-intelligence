/**
 * POST /api/chat — AI chat endpoint
 * Uses OpenRouter API with database context for real AI responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

function buildSystemPrompt(context: {
  taskCount: number;
  leadCount: number;
  callCount: number;
  topLeads: string;
  criteria: string;
  selectedLead: string;
}) {
  return `You are Lead Copilot, an AI-powered lead intelligence assistant for a sales team. You help users find, analyze, and call business prospects.

You have access to a lead pipeline with ${context.leadCount} leads, ${context.taskCount} research tasks, and ${context.callCount} calls made.

Current lead criteria:
${context.criteria || "No criteria set yet."}

${context.topLeads}

${context.selectedLead}

CAPABILITIES:
- Answer questions about leads, scores, evidence, and call results
- Start research to discover new leads (action: start_research)
- Call a lead using the CALL-E voice agent (action: call_lead)
- Update lead criteria (action: update_criteria)
- Explain why leads scored high or low based on evidence

RULES:
- Be concise and direct. Use bullet points and bold for readability.
- When discussing a lead, reference specific evidence and scores.
- When recommending a call, include the lead name in the action.
- If asked to find/discover/search leads, respond with a start_research action.
- If asked to call someone, respond with a call_lead action.
- If asked to change criteria, respond with an update_criteria action.
- Always be helpful and professional. Never make up data that isn't in the context.

When you need to trigger an action, include a JSON block in your response exactly like:
\`\`\`action
{"type":"start_research","label":"Start Research","payload":{"goal":"user request summary"}}
\`\`\`
Or for calling a lead:
\`\`\`action
{"type":"call_lead","label":"Call Lead Name","payload":{"leadId":"lead-uuid-here"}}
\`\`\`
Or for updating criteria:
\`\`\`action
{"type":"update_criteria","label":"Update Criteria"}
\`\`\`

Only include ONE action per response. If no action is needed, just respond normally without an action block.`;
}

async function gatherContext(leadId?: string) {
  const [taskCount, leadCount, callCount, topLeadsRaw, criteriaRaw] = await Promise.all([
    prisma.task.count({ where: { organizationId: DEFAULT_ORG_ID } }),
    prisma.lead.count({ where: { organizationId: DEFAULT_ORG_ID } }),
    prisma.call.count({ where: { organizationId: DEFAULT_ORG_ID } }),
    prisma.lead.findMany({
      where: { organizationId: DEFAULT_ORG_ID },
      orderBy: { score: "desc" },
      take: 5,
      select: { name: true, score: true, location: true, category: true, qualification: true, recommendedAction: true, hypothesis: true },
    }),
    prisma.leadCriteria.findFirst({
      where: { organizationId: DEFAULT_ORG_ID },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const topLeads = topLeadsRaw
    .map((l, i) => `${i + 1}. **${l.name}** — Score: ${l.score}/100 | ${l.location || "Unknown"} | ${l.category || "N/A"} | Status: ${l.qualification} | Action: ${l.recommendedAction || "none"}`)
    .join("\n");

  const c = criteriaRaw?.criteriaJson as Record<string, unknown> | undefined;
  const criteria = c
    ? [
        `- Industry: ${(c.industry as string[])?.join(", ") || "Not set"}`,
        `- Location: ${(c.location as Record<string, unknown>)?.city || "Not set"}, radius ${(c.location as Record<string, unknown>)?.radiusMiles || "N/A"} miles`,
        `- Min Employees: ${c.minEmployees || "Not set"}`,
        `- Required Signals: ${(c.requiredSignals as string[])?.join(", ") || "None"}`,
        `- Excluded: ${(c.excluded as string[])?.join(", ") || "None"}`,
      ].join("\n")
    : "";

  let selectedLeadContext = "";
  if (leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { evidence: true, calls: { include: { result: true }, take: 1 } },
    });
    if (lead) {
      const evidenceText = lead.evidence
        .map((e) => `  - [${e.type}] ${e.claim} (confidence: ${e.confidence || "N/A"})`)
        .join("\n");
      const callText = lead.calls.length
        ? lead.calls[0].result
          ? `Call result: ${lead.calls[0].result.summary}\nQualification: ${lead.calls[0].result.qualifiedResult || "Pending"}`
          : `Call in progress (status: ${lead.calls[0].status})`
        : "No calls made yet.";

      selectedLeadContext = `SELECTED LEAD DETAILS:\n- Name: ${lead.name}\n- Score: ${lead.score}/100\n- Location: ${lead.location || "Unknown"}\n- Category: ${lead.category || "N/A"}\n- Decision Maker: ${lead.decisionMaker || "Unknown"}\n- Phone: ${lead.phone || "N/A"}\n- Website: ${lead.website || "N/A"}\n- Employees: ${lead.employeeCount || "Unknown"}\n- Status: ${lead.status}\n- Qualification: ${lead.qualification}\n- Recommended Action: ${lead.recommendedAction || "none"}\n- Hypothesis: ${lead.hypothesis || "None"}\n\nEvidence:\n${evidenceText || "  No evidence collected."}\n\n${callText}`;
    }
  }

  return { taskCount, leadCount, callCount, topLeads, criteria, selectedLeadContext };
}

function parseAction(content: string): { cleanContent: string; actions: Array<{ type: string; label: string; payload?: Record<string, unknown> }> } {
  const actionRegex = /```action\s*\n(\{[\s\S]*?\})\s*\n```/g;
  const actions: Array<{ type: string; label: string; payload?: Record<string, unknown> }> = [];
  let cleanContent = content;

  let match;
  while ((match = actionRegex.exec(content)) !== null) {
    try {
      const action = JSON.parse(match[1]);
      if (action.type && action.label) {
        actions.push(action);
      }
    } catch {}
  }

  cleanContent = cleanContent.replace(actionRegex, "").trim();
  return { cleanContent, actions };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, taskId, leadId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const context = await gatherContext(leadId || undefined);
    const systemPrompt = buildSystemPrompt({
      ...context,
      selectedLead: context.selectedLeadContext,
    });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "LeadIntel AI Copilot",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenRouter API error:", res.status, errText);
      return NextResponse.json(
        { success: false, error: `AI service error (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const aiContent = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    const { cleanContent, actions } = parseAction(aiContent);

    return NextResponse.json({
      success: true,
      data: { role: "assistant", content: cleanContent, actions },
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
