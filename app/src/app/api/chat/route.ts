/**
 * POST /api/chat — AI chat endpoint
 * Mock LLM responses based on context
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

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

    const lowerMessage = message.toLowerCase();

    // Context-aware mock responses
    let response = "";
    let actions: Array<{ type: string; label: string; payload?: Record<string, unknown> }> = [];

    // If asking about a specific lead
    if (leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { evidence: true, calls: { include: { result: true }, take: 1 } },
      });

      if (lead) {
        if (lowerMessage.includes("why") || lowerMessage.includes("explain")) {
          const evidenceList = lead.evidence
            .filter((e) => e.type === "OBSERVED")
            .map((e) => `• ${e.claim}`)
            .join("\n");

          response = `**Why ${lead.name} scored ${lead.score}/100:**\n\n${lead.hypothesis || "No hypothesis available."}\n\n**Key evidence:**\n${evidenceList || "No evidence collected yet."}\n\n**Recommended action:** ${lead.recommendedAction || "Review lead details"}`;
          
          if (lead.recommendedAction === "call" && !lead.calls.length) {
            actions = [{ type: "call_lead", label: `Call ${lead.name}`, payload: { leadId: lead.id } }];
          }
        } else if (lowerMessage.includes("call") || lowerMessage.includes("what happened")) {
          if (lead.calls.length > 0 && lead.calls[0].result) {
            response = `**Call Result for ${lead.name}:**\n\n${lead.calls[0].result.summary}\n\n**Qualification:** ${lead.calls[0].result.qualifiedResult || "Pending"}\n\n**Recommended next step:** ${lead.recommendedAction || "Review results"}`;
          } else if (lead.calls.length > 0) {
            response = `A call to ${lead.name} is currently **${lead.calls[0].status.toLowerCase()}**. Results will appear here once the call completes.`;
          } else {
            response = `No calls have been made to ${lead.name} yet. Based on their score of ${lead.score}/100, I ${lead.score && lead.score >= 70 ? "strongly recommend" : "suggest"} making a call to verify the hypothesis.\n\nWould you like me to prepare a call brief?`;
            actions = [{ type: "call_lead", label: `Call ${lead.name}`, payload: { leadId: lead.id } }];
          }
        } else {
          response = `**${lead.name}** — Score: ${lead.score}/100\n📍 ${lead.location || "Unknown"} · ${lead.category || "Business"}\n👤 ${lead.decisionMaker || "Decision maker not identified"}\n📞 ${lead.phone || "No phone"}\n\n${lead.hypothesis || ""}\n\nStatus: **${lead.qualification}**`;
        }

        return NextResponse.json({
          success: true,
          data: { role: "assistant", content: response, actions },
        });
      }
    }

    // If asking about task/criteria
    if (lowerMessage.includes("criteria") || lowerMessage.includes("target") || lowerMessage.includes("questionnaire")) {
      const criteria = await prisma.leadCriteria.findFirst({
        where: { organizationId: DEFAULT_ORG_ID },
        orderBy: { createdAt: "desc" },
      });

      if (criteria) {
        const c = criteria.criteriaJson as Record<string, unknown>;
        response = `**Current Lead Criteria:**\n\n• **Industry:** ${(c.industry as string[])?.join(", ") || "Not set"}\n• **Location:** ${(c.location as Record<string, unknown>)?.city || "Not set"}, radius ${(c.location as Record<string, unknown>)?.radiusMiles || "N/A"} miles\n• **Min Employees:** ${c.minEmployees || "Not set"}\n• **Required Signals:** ${(c.requiredSignals as string[])?.join(", ") || "None"}\n• **Excluded:** ${(c.excluded as string[])?.join(", ") || "None"}\n\nYou can modify any criteria by telling me what to change. For example: "Don't target businesses with fewer than 15 employees."`;
        actions = [{ type: "update_criteria", label: "Edit Criteria" }];
      } else {
        response = "No criteria have been set yet. Upload a business document or describe your ideal customer to get started.";
      }
    }
    // Criteria modification
    else if (lowerMessage.includes("don't target") || lowerMessage.includes("exclude") || lowerMessage.includes("change") || lowerMessage.includes("update")) {
      response = `Understood. I've noted your preference. Here's what would change:\n\n> "${message}"\n\nThis modification would affect the current lead set. Would you like me to re-score the remaining leads with the updated criteria?`;
      actions = [
        { type: "update_criteria", label: "Apply & Re-score" },
        { type: "start_research", label: "Apply & Re-discover" },
      ];
    }
    // Start research
    else if (lowerMessage.includes("find") || lowerMessage.includes("search") || lowerMessage.includes("discover") || lowerMessage.includes("start")) {
      response = "I'll start searching for leads based on the current criteria. This will discover candidates, enrich their profiles, analyze evidence, and score them.\n\nOnce complete, you'll see the curated leads in the dashboard with scores and explanations.";
      actions = [{ type: "start_research", label: "Start Research", payload: { goal: message } }];
    }
    // General help
    else if (lowerMessage.includes("help") || lowerMessage.includes("what can")) {
      response = `I can help you with:\n\n• **Upload documents** — Share your business materials and I'll extract your ideal customer profile\n• **Set criteria** — Define or modify what makes a good lead\n• **Explain leads** — Tell you why a lead scored high or low\n• **Start research** — Discover and score new leads\n• **Prepare calls** — Generate call briefs for CALL-E\n• **Explain results** — Summarize what happened during calls\n• **Recommend actions** — Suggest next steps\n\nTry asking: "Why is Austin Smile Center a strong lead?"`;
    }
    // Default conversational
    else {
      // Get some context
      const taskCount = await prisma.task.count({ where: { organizationId: DEFAULT_ORG_ID } });
      const leadCount = await prisma.lead.count({ where: { organizationId: DEFAULT_ORG_ID } });
      const callCount = await prisma.call.count({ where: { organizationId: DEFAULT_ORG_ID } });

      if (taskCount === 0 && leadCount === 0) {
        response = "Welcome! To get started, you can:\n\n1. **Upload a business document** describing your services and target market\n2. **Tell me about your business** — e.g., \"We sell AI receptionists to dental practices in Austin\"\n3. **Start research directly** — e.g., \"Find dental practices in Austin that might need our services\"\n\nWhat would you like to do?";
        actions = [{ type: "start_research", label: "Start Research" }];
      } else {
        response = `Here's your current status:\n\n• **Tasks:** ${taskCount}\n• **Leads discovered:** ${leadCount}\n• **Calls made:** ${callCount}\n\nI can explain any lead's score, start new research, prepare calls, or help you modify your criteria. What would you like to do?`;
      }
    }

    return NextResponse.json({
      success: true,
      data: { role: "assistant", content: response, actions },
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
