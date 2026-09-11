/**
 * GET/POST /api/criteria — Read / write the organisation's lead criteria
 * and business profile. The chat onboarding flow persists the structured
 * JSON extracted by the LLM here; the pipeline reads it from DB.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { LeadCriteriaSchema, BusinessProfileSchema } from "@/lib/types";
import { runPipeline } from "@/server/services/orchestrator";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

// ─── GET ──────────────────────────────────────────────────────

export async function GET() {
  try {
    const [criteria, profile] = await Promise.all([
      prisma.leadCriteria.findFirst({
        where: { organizationId: DEFAULT_ORG_ID },
        orderBy: { createdAt: "desc" },
      }),
      prisma.businessProfile.findFirst({
        where: { organizationId: DEFAULT_ORG_ID },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        criteria: (criteria?.criteriaJson as Record<string, unknown>) || null,
        profile: (profile?.profileJson as Record<string, unknown>) || null,
      },
    });
  } catch (error) {
    console.error("GET /api/criteria error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const criteriaRaw = body.criteria as Record<string, unknown> | undefined;
    const profileRaw = body.profile as Record<string, unknown> | undefined;
    const autoStart = Boolean(body.autoStart);

    if (!criteriaRaw && !profileRaw) {
      return NextResponse.json(
        { success: false, error: "Provide at least a criteria or profile object." },
        { status: 400 },
      );
    }

    let parsedCriteria: Record<string, unknown> | undefined;
    let parsedProfile: Record<string, unknown> | undefined;

    if (criteriaRaw) {
      const res = LeadCriteriaSchema.safeParse(criteriaRaw);
      if (!res.success) {
        return NextResponse.json(
          { success: false, error: "Invalid criteria", details: res.error.issues.slice(0, 5) },
          { status: 400 },
        );
      }
      parsedCriteria = res.data as Record<string, unknown>;
    }

    if (profileRaw) {
      const res = BusinessProfileSchema.safeParse(profileRaw);
      if (!res.success) {
        return NextResponse.json(
          { success: false, error: "Invalid profile", details: res.error.issues.slice(0, 5) },
          { status: 400 },
        );
      }
      parsedProfile = res.data as Record<string, unknown>;
    }

    // Ensure default org exists
    await prisma.organization.upsert({
      where: { id: DEFAULT_ORG_ID },
      create: { id: DEFAULT_ORG_ID, name: "Demo Organization" },
      update: {},
    });

    const [lastCriteria, lastProfile] = await Promise.all([
      prisma.leadCriteria.findFirst({
        where: { organizationId: DEFAULT_ORG_ID },
        orderBy: { createdAt: "desc" },
        select: { version: true },
      }),
      prisma.businessProfile.findFirst({
        where: { organizationId: DEFAULT_ORG_ID },
        orderBy: { createdAt: "desc" },
        select: { version: true },
      }),
    ]);

    if (parsedCriteria) {
      await prisma.leadCriteria.create({
        data: {
          organizationId: DEFAULT_ORG_ID,
          criteriaJson: parsedCriteria as unknown as Prisma.InputJsonValue,
          version: (lastCriteria?.version || 0) + 1,
        },
      });
    }

    if (parsedProfile) {
      await prisma.businessProfile.create({
        data: {
          organizationId: DEFAULT_ORG_ID,
          profileJson: parsedProfile as unknown as Prisma.InputJsonValue,
          version: (lastProfile?.version || 0) + 1,
        },
      });
    }

    let taskId: string | undefined;
    if (autoStart) {
      const requestGoal = typeof body.goal === "string" ? body.goal.trim() : "";
      const goal =
        requestGoal ||
        buildGoalFromCriteria(parsedCriteria) ||
        buildGoalFromProfile(parsedProfile) ||
        "Find qualified leads";
      const task = await prisma.task.create({
        data: {
          organizationId: DEFAULT_ORG_ID,
          goal,
          status: "CREATED",
          progressJson: { discovered: 0, enriched: 0, scored: 0, qualified: 0, calls: 0, completedCalls: 0, failedCalls: 0 },
        },
      });
      runPipeline(task.id, DEFAULT_ORG_ID).catch((err: unknown) => console.error("Pipeline error:", err));
      taskId = task.id;
    }

    return NextResponse.json({ success: true, data: { saved: true, taskId: taskId || null } });
  } catch (error) {
    console.error("POST /api/criteria error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

function buildGoalFromCriteria(c?: Record<string, unknown>): string | null {
  if (!c) return null;
  const industries = (c.industry as string[] | undefined) || [];
  const loc = (c.location as Record<string, unknown> | undefined) || {};
  const city = loc.city as string | undefined;
  const state = loc.state as string | undefined;
  const place = [city, state].filter(Boolean).join(", ");
  const what = industries.length ? industries.join(" / ") : "businesses";
  return `Find qualified ${what} leads in ${place || "target location"}`;
}

function buildGoalFromProfile(p?: Record<string, unknown>): string | null {
  if (!p) return null;
  const company = (p.company as Record<string, unknown> | undefined) || {};
  const industry = (company.industry as string) || "businesses";
  const regions = (p.geography as Record<string, unknown> | undefined)?.regions as string[] | undefined;
  const place = regions?.length ? regions.join(", ") : "target location";
  return `Find qualified ${industry} leads in ${place}`;
}