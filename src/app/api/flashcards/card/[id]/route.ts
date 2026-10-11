import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReviewCardSchema = z.object({
  difficulty: z.enum(["hard", "medium", "easy", "mastered"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = ReviewCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const { difficulty } = parsed.data;

    // Verify ownership via flashcardSet
    const card = await prisma.flashcard.findFirst({
      where: {
        id,
        flashcardSet: {
          userId: user.id,
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Spaced repetition intervals (in days)
    const intervalDays = {
      hard: 1,
      medium: 3,
      easy: 7,
      mastered: 14,
    }[difficulty];

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);

    const updated = await prisma.flashcard.update({
      where: { id },
      data: {
        difficulty,
        nextReviewAt: nextReview,
      },
    });

    return NextResponse.json({ card: updated });
  } catch (error) {
    console.error("Update card error:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const card = await prisma.flashcard.findFirst({
    where: {
      id,
      flashcardSet: {
        userId: user.id,
      },
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  await prisma.flashcard.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Card deleted" });
}
