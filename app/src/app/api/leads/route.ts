/**
 * GET /api/leads — Get all leads for the organization
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sortBy = url.searchParams.get("sortBy") || "score";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const minScore = parseInt(url.searchParams.get("minScore") || "0");
    const qualification = url.searchParams.get("qualification");
    const search = url.searchParams.get("search");

    const where: Record<string, unknown> = { organizationId: DEFAULT_ORG_ID };
    if (minScore > 0) where.score = { gte: minScore };
    if (qualification && qualification !== "all") where.qualification = qualification;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where: where as Parameters<typeof prisma.lead.findMany>[0] extends { where?: infer W } ? W : never,
      include: {
        evidence: true,
        calls: {
          include: { result: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: sortBy === "score" ? { score: sortOrder as "asc" | "desc" } : { createdAt: sortOrder as "asc" | "desc" },
    });

    return NextResponse.json({
      success: true,
      data: leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        website: lead.website,
        location: lead.location,
        category: lead.category,
        score: lead.score,
        scoreComponents: lead.scoreComponents,
        status: lead.status,
        qualification: lead.qualification,
        hypothesis: lead.hypothesis,
        recommendedAction: lead.recommendedAction,
        decisionMaker: lead.decisionMaker,
        employeeCount: lead.employeeCount,
        evidence: lead.evidence.map((e) => ({
          id: e.id,
          type: e.type,
          claim: e.claim,
          source: e.source,
          confidence: e.confidence,
          observedAt: e.observedAt,
        })),
        latestCall: lead.calls[0]
          ? {
              id: lead.calls[0].id,
              status: lead.calls[0].status,
              completedAt: lead.calls[0].completedAt,
              result: lead.calls[0].result
                ? {
                    summary: lead.calls[0].result.summary,
                    qualification: lead.calls[0].result.qualifiedResult,
                  }
                : null,
            }
          : null,
        createdAt: lead.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
