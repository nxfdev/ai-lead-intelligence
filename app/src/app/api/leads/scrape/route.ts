/**
 * POST /api/leads/scrape — Trigger lead generation from multiple platforms
 */

import { NextRequest, NextResponse } from "next/server";
import { LeadGenerationOrchestrator } from "@/server/services/scraper/lead-orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location, category, platforms, maxResults, requirePhone } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    const orchestrator = new LeadGenerationOrchestrator();
    const result = await orchestrator.generateLeads({
      query,
      location: location || undefined,
      category: category || undefined,
      platforms: platforms || ["google", "yelp", "social"],
      maxResults: maxResults || 20,
      requirePhone: requirePhone !== false,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: result.jobId,
        totalFound: result.totalFound,
        leadsWithPhone: result.leadsWithPhone,
        leadsStored: result.leadsStored,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("POST /api/leads/scrape error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
