/**
 * GET /api/calls — Get all calls for the organization
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  try {
    const calls = await prisma.call.findMany({
      where: { organizationId: DEFAULT_ORG_ID },
      include: {
        result: true,
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            location: true,
            category: true,
            score: true,
            qualification: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: calls.map((call) => ({
        id: call.id,
        status: call.status,
        lead: call.lead,
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
      })),
    });
  } catch (error) {
    console.error("GET /api/calls error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
