import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { summarizeNotes } from "@/lib/gemini";
import { z } from "zod";

const SummarizeRequestSchema = z.object({
  content: z.string().min(20, "Lesson content must be at least 20 characters"),
  subject: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = SummarizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { content, subject } = parsed.data;

    const summaryResult = await summarizeNotes({
      content,
      subject,
      educationLevel: user.educationLevel,
    });

    return NextResponse.json({ summaryResult });
  } catch (error) {
    console.error("Notes summarization error:", error);
    return NextResponse.json(
      { error: "Failed to summarize notes. Please try again." },
      { status: 500 }
    );
  }
}
