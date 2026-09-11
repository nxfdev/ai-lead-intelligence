/**
 * Batch Lead Export API Route
 *
 * Exports discovered and enriched leads as CSV or JSON.
 * Query parameters:
 * - taskId: filter leads belonging to a specific batch task
 * - format: 'csv' | 'json' (default: 'csv')
 * - qualification: 'QUALIFIED' | 'DISQUALIFIED' | 'PENDING'
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const format = (searchParams.get("format") || "csv").toLowerCase();
    const qualification = searchParams.get("qualification");

    const whereClause: Record<string, unknown> = {};
    if (taskId) whereClause.taskId = taskId;
    if (qualification) whereClause.qualification = qualification;

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        evidence: true,
        calls: {
          include: { result: true },
        },
      },
      orderBy: { score: "desc" },
    });

    if (format === "json") {
      return NextResponse.json({
        success: true,
        total: leads.length,
        leads,
      });
    }

    // CSV format
    const headers = [
      "Name",
      "Phone",
      "Website",
      "Email",
      "Email Deliverability",
      "Decision Maker",
      "Category",
      "Location",
      "Score",
      "Qualification",
      "Social Links",
      "Evidence Summary",
      "Discovered At",
    ];

    const rows = leads.map((lead) => {
      const profile = (lead.profileJson as Record<string, unknown>) || {};
      const emails = (profile.emails as string[]) || [];
      const verifiedEmail = profile.verifiedEmail as { email?: string; status?: string } | undefined;
      const primaryEmail = verifiedEmail?.email || emails[0] || "";
      const emailStatus = verifiedEmail?.status || (primaryEmail ? "unverified" : "");

      const socials = (profile.socialProfiles as Array<{ platform: string; url: string }>) || [];
      const socialLinksStr = socials.map((s) => `${s.platform}: ${s.url}`).join(" | ");

      const evidenceClaims = lead.evidence.map((e) => `[${e.type}] ${e.claim}`).join(" ; ");

      return [
        escapeCsvField(lead.name),
        escapeCsvField(lead.phone),
        escapeCsvField(lead.website),
        escapeCsvField(primaryEmail),
        escapeCsvField(emailStatus),
        escapeCsvField(lead.decisionMaker),
        escapeCsvField(lead.category),
        escapeCsvField(lead.location),
        escapeCsvField(lead.score),
        escapeCsvField(lead.qualification),
        escapeCsvField(socialLinksStr),
        escapeCsvField(evidenceClaims),
        escapeCsvField(lead.createdAt.toISOString()),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-export-${taskId || "all"}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
