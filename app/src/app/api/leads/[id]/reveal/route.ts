import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ApolloClient, ApolloApiError } from "@/server/services/apollo/client";
import { normalizePhone } from "@/server/services/scraper/phone-extractor";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Apollo API key not configured" },
        { status: 503 }
      );
    }

    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead || lead.organizationId !== DEFAULT_ORG_ID) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const profile = (lead.profileJson ?? {}) as Record<string, unknown>;
    const linkedinUrl = typeof profile.linkedinUrl === "string" ? profile.linkedinUrl : undefined;
    const apolloId = typeof profile.apolloId === "string" ? profile.apolloId : undefined;
    const organization = typeof profile.organization === "string" ? profile.organization : undefined;

    if (!linkedinUrl && !apolloId && !organization) {
      return NextResponse.json(
        { success: false, error: "Lead has no Apollo identity to match against (not an Apollo lead)." },
        { status: 400 }
      );
    }

    const client = new ApolloClient(apiKey, {
      baseUrl: process.env.APOLLO_BASE_URL,
      timeoutMs: Number(process.env.APOLLO_TIMEOUT_MS || 20_000),
      reveal: true,
    });

    const person = await client.matchPerson(
      linkedinUrl
        ? { linkedin_url: linkedinUrl }
        : { name: lead.name, organization_name: organization },
      true
    );

    if (!person) {
      return NextResponse.json(
        { success: false, error: "Apollo could not match this contact. Try a different lead." },
        { status: 422 }
      );
    }

    const revealedPhone = person.phone ? normalizePhone(person.phone) : undefined;
    const revealedEmail = person.email || undefined;

    if (!revealedPhone && !revealedEmail) {
      return NextResponse.json(
        { success: false, error: "Apollo returned no contact information for this person yet." },
        { status: 422 }
      );
    }

    const updatedProfile: Record<string, unknown> = {
      ...profile,
      email: revealedEmail ?? profile.email,
      emailStatus: person.email_status ?? profile.emailStatus ?? "unknown",
      phoneStatus: person.phone_status ?? profile.phoneStatus ?? "available",
      emails: revealedEmail
        ? Array.isArray(profile.emails) && (profile.emails as unknown[]).includes(revealedEmail)
          ? [...(profile.emails as unknown[])]
          : [...(Array.isArray(profile.emails) ? (profile.emails as unknown[]) : []), revealedEmail]
        : Array.isArray(profile.emails)
          ? (profile.emails as unknown[])
          : [],
      title: person.title ?? profile.title,
      revealRequired: !revealedPhone && !revealedEmail ? true : false,
    };

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        phone: lead.phone || revealedPhone || undefined,
        profileJson: updatedProfile as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.evidence.create({
      data: {
        leadId: lead.id,
        type: "VERIFIED",
        claim: `Contact information revealed via Apollo (${[revealedPhone && "phone", revealedEmail && "email"].filter(Boolean).join(" + ")})`,
        source: "apollo_reveal",
        confidence: 0.95,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedLead.id,
        phone: updatedLead.phone,
        email: revealedEmail ?? null,
        emailStatus: updatedProfile.emailStatus,
        phoneStatus: updatedProfile.phoneStatus,
      },
    });
  } catch (error) {
    if (error instanceof ApolloApiError) {
      if (error.status === 402 || error.code === "insufficient_credits") {
        return NextResponse.json(
          { success: false, error: "Apollo credit limit reached. Add credits or turn the feature off." },
          { status: 402 }
        );
      }
      if (error.status === 404 || error.status === 422) {
        return NextResponse.json({ success: false, error: error.message }, { status: 422 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 502 });
    }
    console.error("POST /api/leads/[id]/reveal error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}