import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSetting } from "@/lib/settings";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({ where: { organizationId: DEFAULT_ORG_ID } });
    const data: Record<string, string> = {};
    for (const s of settings) data[s.key] = s.value;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const key = typeof body.key === "string" ? body.key.trim() : undefined;
    const value = typeof body.value === "string" ? body.value.trim() : undefined;

    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: "key and value are required" },
        { status: 400 }
      );
    }

    const allowedKeys = new Set(["apollo.reveal"]);
    if (!allowedKeys.has(key)) {
      return NextResponse.json(
        { success: false, error: `Unknown setting key: ${key}` },
        { status: 400 }
      );
    }

    await setSetting(key, value);
    return NextResponse.json({ success: true, data: { key, value } });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}