import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const apkPath = path.join(process.cwd(), "public", "ai-studymate.apk");
    const fileBuffer = await fs.readFile(apkPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="ai-studymate.apk"',
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("APK download route error:", error);
    return NextResponse.json(
      { error: "APK package not found or still compiling. Please check back in a moment." },
      { status: 404 }
    );
  }
}
