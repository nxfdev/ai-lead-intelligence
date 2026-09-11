/**
 * Phone Agent — Synthetic + CALL-E Adapters
 * 
 * Implements the PhoneAgent interface with:
 * - SyntheticPhoneAgent: 2-5s simulated calls with realistic results
 * - CallePhoneAgent: real CALL-E SDK integration
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

    return {
      id: `sim_${crypto.randomUUID()}`,
      status: "completed",
      structuredResult: result,
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
    this.apiKey = process.env.CALL_E_API_KEY || "";
    if (!this.apiKey) {
      console.warn("CALL_E_API_KEY not set — CALL-E calls will fail");
    }
  }

  async createCall(input: CreateCallInput): Promise<PhoneCallResult> {
    // Dynamic import to avoid issues when @call-e/calle isn't installed
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { CallE } = await (new Function('return import("@call-e/calle")')() as Promise<any>);
      const client = new CallE({ apiKey: this.apiKey });

      const created = await client.calls.create(
        {
          task: input.task,
          recipients: [
            { phones: [input.phone] },
          ],
          resultSchema: input.resultSchema,
        },
        { idempotencyKey: input.idempotencyKey }
      );

      // Wait for result (with timeout)
      const completed = await client.calls.waitForResult(created.id, {
        timeoutMs: 120_000,
        intervalMs: 2_000,
      });

      return {
        id: completed.id,
        status: "completed",
        structuredResult: completed.result as CallStructuredResult | undefined,
        duration: undefined, // CALL-E may not provide duration directly
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { CallE } = await (new Function('return import("@call-e/calle")')() as Promise<any>);
      const client = new CallE({ apiKey: this.apiKey });

      const call = await client.calls.get(id);
      return {
        id: call.id,
        status: call.status === "completed" ? "completed" : "in_progress",
        structuredResult: call.result as CallStructuredResult | undefined,
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
