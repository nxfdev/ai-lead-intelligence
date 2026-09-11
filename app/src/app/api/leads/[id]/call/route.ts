/**
 * POST /api/leads/:id/call — Request a CALL-E call for a lead
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { executeCall } from "@/server/services/orchestrator";
import { generateIdempotencyKey } from "@/lib/utils";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;

    // Validate lead exists
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    if (!lead.phone) {
      return NextResponse.json(
        { success: false, error: "Lead has no phone number" },
        { status: 400 }
      );
    }

    // Check for existing active call
    const existingCall = await prisma.call.findFirst({
      where: {
        leadId,
        status: { in: ["PENDING", "QUEUED", "IN_PROGRESS"] },
      },
    });

    if (existingCall) {
      return NextResponse.json(
        { success: false, error: "A call is already in progress for this lead" },
        { status: 409 }
      );
    }

    // Create call record
    const call = await prisma.call.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        leadId,
        idempotencyKey: generateIdempotencyKey("call", DEFAULT_ORG_ID, leadId),
        status: "PENDING",
      },
    });

    // Execute call asynchronously
    executeCall(call.id, leadId, DEFAULT_ORG_ID).catch((err) => {
      console.error("Call execution error:", err);
    });

    return NextResponse.json({
      success: true,
      data: {
        callId: call.id,
        status: call.status,
      },
    });
  } catch (error) {
    console.error("POST /api/leads/:id/call error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
