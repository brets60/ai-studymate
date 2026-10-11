import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const zipPath = path.join(process.cwd(), "public", "ai-studymate.zip");
    const fileBuffer = await fs.readFile(zipPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="ai-studymate-full-source.zip"',
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download route error:", error);
    return NextResponse.json(
      { error: "ZIP package not found. Please try again." },
      { status: 404 }
    );
  }
}
