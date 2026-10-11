import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, extractTextFromFile } from "@/lib/document-parser";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subjectId = formData.get("subjectId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB maximum allowed size" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.match(/\.(txt|md|csv|json|pdf|png|jpe?g|webp)$/i)) {
      return NextResponse.json(
        { error: "Unsupported file type. Supported types: PDF, Text, Markdown, CSV, Images" },
        { status: 400 }
      );
    }

    // Secure private upload directory per user
    const uploadDir = path.join(process.cwd(), "uploads", user.id);
    await fs.mkdir(uploadDir, { recursive: true });

    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${crypto.randomUUID()}_${safeFilename}`;
    const destinationPath = path.join(uploadDir, uniqueName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(destinationPath, buffer);

    // Extract text content
    let textContent = "";
    try {
      textContent = await extractTextFromFile(destinationPath, file.type);
    } catch {
      textContent = `Content extraction unavailable for ${file.name}`;
    }

    const document = await prisma.uploadedDocument.create({
      data: {
        userId: user.id,
        subjectId: subjectId && subjectId.trim() !== "" ? subjectId : null,
        filename: file.name,
        storagePath: destinationPath,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        textContent,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload and process document" },
      { status: 500 }
    );
  }
}
