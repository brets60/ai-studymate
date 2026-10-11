import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { explainDocument } from "@/lib/gemini";
import { z } from "zod";

const ExplainRequestSchema = z.object({
  question: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ExplainRequestSchema.safeParse(body);
    const question = parsed.success ? parsed.data.question : undefined;

    const doc = await prisma.uploadedDocument.findFirst({
      where: { id, userId: user.id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const explanation = await explainDocument({
      documentText: doc.textContent || `Document filename: ${doc.filename}`,
      question,
      educationLevel: user.educationLevel,
    });

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Explain document error:", error);
    return NextResponse.json(
      { error: "Failed to explain document" },
      { status: 500 }
    );
  }
}
