/**
 * POST /api/documents — Upload and parse business documents
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";
const UPLOAD_DIR = join(process.cwd(), "uploads");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ];

    const ext = file.name.split(".").pop()?.toLowerCase();
    const isAllowed = allowedTypes.includes(file.type) || 
      ["pdf", "docx", "txt", "md"].includes(ext || "");

    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Use PDF, DOCX, TXT, or MD." },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);

    // Extract text based on file type
    let extractedText = "";

    if (ext === "txt" || ext === "md" || file.type === "text/plain" || file.type === "text/markdown") {
      extractedText = buffer.toString("utf-8");
    } else if (ext === "pdf" || file.type === "application/pdf") {
      try {
        const pdfModule = await import("pdf-parse");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfParse = (pdfModule as any).default || pdfModule;
        const result = await pdfParse(buffer);
        extractedText = result.text;
      } catch (e) {
        console.error("PDF parsing error:", e);
        extractedText = "[PDF parsing failed — text extraction unavailable]";
      }
    } else if (ext === "docx") {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (e) {
        console.error("DOCX parsing error:", e);
        extractedText = "[DOCX parsing failed — text extraction unavailable]";
      }
    }

    // Ensure default org exists
    await prisma.organization.upsert({
      where: { id: DEFAULT_ORG_ID },
      create: { id: DEFAULT_ORG_ID, name: "Demo Organization" },
      update: {},
    });

    // Store document record
    const doc = await prisma.businessDocument.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        filename: file.name,
        storagePath: filepath,
        mimeType: file.type || `application/${ext}`,
        extractedText,
        fileSize: buffer.length,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        filename: doc.filename,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        extractedTextLength: extractedText.length,
        extractedTextPreview: extractedText.substring(0, 500),
      },
    });
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
