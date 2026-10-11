import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateFlashcards } from "@/lib/gemini";
import { z } from "zod";

const FlashcardsRequestSchema = z.object({
  subjectId: z.string().optional(),
  subjectName: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  count: z.number().min(1).max(20).default(5),
  content: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = FlashcardsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { subjectId, subjectName, topic, count, content } = parsed.data;

    const generated = await generateFlashcards({
      subject: subjectName,
      topic,
      count,
      content,
    });

    const flashcardSet = await prisma.flashcardSet.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title: generated.title || `${subjectName}: ${topic} Deck`,
        flashcards: {
          create: generated.flashcards.map((f) => ({
            question: f.question,
            answer: f.answer,
            difficulty: "medium",
            nextReviewAt: new Date(),
          })),
        },
      },
      include: {
        subject: true,
        flashcards: true,
      },
    });

    return NextResponse.json({ flashcardSet }, { status: 201 });
  } catch (error) {
    console.error("Generate flashcards error:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
