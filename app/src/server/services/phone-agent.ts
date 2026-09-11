/**
 * Phone Agent — CALL-E Integration
 * 
 * Implements the PhoneAgent interface with:
 * - SyntheticPhoneAgent: simulated calls for testing
 * - CallePhoneAgent: real calls via CALL-E SDK
 */

import type { PhoneAgent, CreateCallInput, PhoneCallResult, CallStructuredResult } from "@/lib/types";
import { delay } from "@/lib/utils";

// ─── Synthetic Results Data ─────────────────────────────────

const SYNTHETIC_RESULTS: Record<string, CallStructuredResult> = {
  default_positive: {
    decisionMakerReached: true,
    needConfirmed: true,
    currentSolution: "Human receptionist, sometimes overwhelmed during peak hours",
    nextAction: "Schedule follow-up meeting to discuss AI receptionist solution",
    additionalNotes: "Office manager expressed strong interest. Currently missing 5-10 calls per day during peak periods.",
  },
  default_neutral: {
    decisionMakerReached: true,
    needConfirmed: false,
    currentSolution: "Full-time receptionist handles all calls",
    nextAction: "Follow up in 3 months — no immediate need but open to future conversation",
    additionalNotes: "Business is satisfied with current setup but acknowledged occasional missed calls after hours.",
  },
  default_negative: {
    decisionMakerReached: false,
    needConfirmed: false,
    currentSolution: "Unknown — could not reach decision maker",
    nextAction: "Retry call at different time or try alternative contact",
    additionalNotes: "Reached front desk. Decision maker was unavailable. Was told to call back tomorrow morning.",
  },
  // Named results for specific leads
  "Austin Smile Center": {
    decisionMakerReached: true,
    needConfirmed: true,
    currentSolution: "Receptionist, but frequently overwhelmed during peak morning hours",
    nextAction: "Schedule product demo with Dr. Sarah Mitchell for next week",
    additionalNotes: "Dr. Mitchell confirmed the clinic misses approximately 8-12 calls per day during busy periods. Currently paying overtime for reception staff. Very interested in AI solution.",
  },
  "Pflugerville Dental Associates": {
    decisionMakerReached: true,
    needConfirmed: true,
    currentSolution: "Two receptionists rotate, but extended hours (7AM-7PM) make full coverage difficult",
    nextAction: "Send pricing information and schedule follow-up call",
    additionalNotes: "Dr. Park confirmed patients complain about hold times. Already budgeted for a phone system upgrade this quarter.",
  },
  "Round Rock Dental Care": {
    decisionMakerReached: true,
    needConfirmed: true,
    currentSolution: "Single receptionist plus voicemail",
    nextAction: "Follow up recommended — decision maker wants to discuss with partners",
    additionalNotes: "Mark Johnson (Office Manager) confirmed they just posted a job for a second receptionist because call volume has increased significantly.",
  },
  "Lakeway Family Dentistry": {
    decisionMakerReached: true,
    needConfirmed: true,
    currentSolution: "Receptionist during office hours, voicemail after hours",
    nextAction: "Schedule product demonstration",
    additionalNotes: "Dr. Chen mentioned losing patients to competitors who have better phone availability. Particularly interested in after-hours call handling.",
  },
  "Westlake Dental Studio": {
    decisionMakerReached: false,
    needConfirmed: false,
    currentSolution: "Unknown — Dr. Nguyen was with a patient",
    nextAction: "Call back Thursday afternoon when Dr. Nguyen is available",
    additionalNotes: "Front desk confirmed they do get many calls that go to voicemail. Suggested calling Thursday after 2 PM.",
  },
};

/**
 * SyntheticPhoneAgent — simulates phone calls with realistic delays and results
 */
export class SyntheticPhoneAgent implements PhoneAgent {
  async createCall(input: CreateCallInput): Promise<PhoneCallResult> {
    // Simulate call duration (2-5 seconds)
    const callDuration = 2000 + Math.random() * 3000;
    await delay(callDuration);

    // Determine which result to return
    const leadName = (input.metadata?.leadName as string) || "";
    let result: CallStructuredResult;

    if (SYNTHETIC_RESULTS[leadName]) {
      result = SYNTHETIC_RESULTS[leadName];
    } else {
      // Randomly pick positive/neutral/negative
      const roll = Math.random();
      if (roll < 0.6) result = SYNTHETIC_RESULTS.default_positive;
      else if (roll < 0.85) result = SYNTHETIC_RESULTS.default_neutral;
      else result = SYNTHETIC_RESULTS.default_negative;
    }

    // Generate synthetic transcript
    const transcript = `AI Agent: Hello, this is Sarah from LeadIntel. I'm calling about your business ${leadName ? `at ${leadName}` : ""}. How are you today?\n\nLead: I'm doing well, thank you. How can I help you?\n\nAI Agent: I'm reaching out because we help businesses like yours manage their phone calls more efficiently with our AI receptionist solution. Do you currently have a receptionist handling your calls?\n\nLead: ${result.currentSolution || "Yes, we have someone handling calls."}\n\nAI Agent: That's great! Many businesses like yours find that they miss calls during peak hours. Do you experience that issue?\n\nLead: ${result.needConfirmed ? "Yes, actually we do miss quite a few calls during busy times." : "Not really, we seem to manage okay."}\n\nAI Agent: ${result.needConfirmed ? "I'd love to show you how our AI solution can help ensure you never miss another call. Would you be open to a quick demo?" : "I understand. Well, if that changes in the future, we'd be happy to help."}\n\nLead: ${result.decisionMakerReached ? (result.needConfirmed ? "Sure, that sounds interesting. Let's schedule something." : "Maybe in the future.") : "Let me talk to my manager and get back to you."}\n\nAI Agent: Perfect! ${result.nextAction || "We'll be in touch soon."} Thank you for your time!`;

    return {
      id: `sim_${crypto.randomUUID()}`,
      status: "completed",
      structuredResult: result,
      transcript,
      duration: Math.round(callDuration / 1000),
    };
  }

  async getCall(id: string): Promise<PhoneCallResult> {
    return {
      id,
      status: "completed",
      duration: 3,
    };
  }
}

/**
 * CallePhoneAgent — real CALL-E SDK integration
 */
export class CallePhoneAgent implements PhoneAgent {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.CALLE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("CALLE_API_KEY not set — CALL-E calls will fail");
    }
  }

  async createCall(input: CreateCallInput): Promise<PhoneCallResult> {
    try {
      const { CalleClient } = await import("@call-e/calle");
      const client = new CalleClient({
        apiKey: this.apiKey,
        baseUrl: "https://api.heycall-e.com",
      });

      // Create and wait for call completion
      const call = await client.calls.createAndWait(
        {
          task: input.task,
          recipients: [{ phones: [input.phone] }],
          resultSchema: input.resultSchema as Record<string, unknown> | undefined,
        },
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        }
      );

      // Fetch transcript from events
      let transcript: string | undefined;
      try {
        const events = await client.calls.listEvents(call.id);
        const transcriptParts: string[] = [];
        for (const event of events) {
          const eventData = event.data as Record<string, unknown> | undefined;
          if (event.type === "speech_to_text" && eventData?.text) {
            const role = (eventData.role as string) || "unknown";
            transcriptParts.push(`${role}: ${eventData.text}`);
          }
        }
        if (transcriptParts.length > 0) {
          transcript = transcriptParts.join("\n");
        }
      } catch (err) {
        console.warn("Failed to fetch transcript:", err);
      }

      return {
        id: call.id,
        status: call.status === "completed" ? "completed" : "failed",
        structuredResult: call.structuredResult as CallStructuredResult | undefined,
        transcript,
        duration: undefined,
      };
    } catch (error) {
      console.error("CALL-E call failed:", error);
      return {
        id: `err_${crypto.randomUUID()}`,
        status: "failed",
      };
    }
  }

  async getCall(id: string): Promise<PhoneCallResult> {
    try {
      const { CalleClient } = await import("@call-e/calle");
      const client = new CalleClient({
        apiKey: this.apiKey,
        baseUrl: "https://api.heycall-e.com",
      });

      const call = await client.calls.get(id);
      return {
        id: call.id,
        status: call.status === "completed" ? "completed" : "in_progress",
        structuredResult: call.structuredResult as CallStructuredResult | undefined,
      };
    } catch (error) {
      console.error("CALL-E getCall failed:", error);
      return { id, status: "failed" };
    }
  }
}

/**
 * Factory: creates the appropriate phone agent based on CALL_MODE env var
 */
export function createPhoneAgent(): PhoneAgent {
  const mode = process.env.CALL_MODE || "synthetic";

  if (mode === "live") {
    console.log("📞 Using LIVE CALL-E phone agent");
    return new CallePhoneAgent();
  }

  console.log("🧪 Using SYNTHETIC phone agent");
  return new SyntheticPhoneAgent();
}
