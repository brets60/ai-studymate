import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SaveNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  originalContent: z.string().min(1, "Original content is required"),
  summary: z.string().min(1, "Summary is required"),
  subjectId: z.string().optional(),
  keyConcepts: z.any().optional(),
  keyTerms: z.any().optional(),
  createFlashcards: z.boolean().optional(),
  flashcardsList: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");

  const notes = await prisma.studyNote.findMany({
    where: {
      userId: user.id,
      ...(subjectId ? { subjectId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      subject: true,
    },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = SaveNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      title,
      originalContent,
      summary,
      subjectId,
      keyConcepts,
      keyTerms,
      createFlashcards,
      flashcardsList,
    } = parsed.data;

    const note = await prisma.studyNote.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title,
        originalContent,
        summary,
        keyConcepts: keyConcepts ? JSON.stringify(keyConcepts) : null,
        keyTerms: keyTerms ? JSON.stringify(keyTerms) : null,
      },
      include: {
        subject: true,
      },
    });

    // If student requested creating a flashcard set alongside the note
    let createdFlashcardSetId: string | null = null;
    if (createFlashcards && flashcardsList && flashcardsList.length > 0) {
      const flashSet = await prisma.flashcardSet.create({
        data: {
          userId: user.id,
          subjectId: subjectId || null,
          title: `${title} - Flashcards`,
          flashcards: {
            create: flashcardsList.map((fc) => ({
              question: fc.question,
              answer: fc.answer,
              difficulty: "medium",
            })),
          },
        },
      });
      createdFlashcardSetId = flashSet.id;
    }

    return NextResponse.json(
      { note, flashcardSetId: createdFlashcardSetId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Save note error:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}
