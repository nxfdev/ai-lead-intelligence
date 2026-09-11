/**
 * GET /api/calls/:id — Get call details
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        result: true,
        lead: {
          select: { name: true, phone: true, location: true, category: true },
        },
      },
    });

    if (!call) {
      return NextResponse.json(
        { success: false, error: "Call not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: call.id,
        status: call.status,
        lead: call.lead,
        brief: call.briefJson,
        duration: call.duration,
        startedAt: call.startedAt,
        completedAt: call.completedAt,
        result: call.result
          ? {
              summary: call.result.summary,
              structuredResult: call.result.structuredResult,
              qualification: call.result.qualifiedResult,
              confidence: call.result.confidence,
            }
          : null,
        createdAt: call.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/calls/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
