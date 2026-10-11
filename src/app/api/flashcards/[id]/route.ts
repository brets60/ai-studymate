import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AddCardSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const set = await prisma.flashcardSet.findFirst({
    where: { id, userId: user.id },
    include: {
      subject: true,
      flashcards: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!set) {
    return NextResponse.json({ error: "Flashcard deck not found" }, { status: 404 });
  }

  return NextResponse.json({ set });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const set = await prisma.flashcardSet.findFirst({
    where: { id, userId: user.id },
  });

  if (!set) {
    return NextResponse.json({ error: "Flashcard deck not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = AddCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const card = await prisma.flashcard.create({
      data: {
        flashcardSetId: set.id,
        question: parsed.data.question,
        answer: parsed.data.answer,
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error("Add card error:", error);
    return NextResponse.json({ error: "Failed to add card" }, { status: 500 });
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

  const set = await prisma.flashcardSet.findFirst({
    where: { id, userId: user.id },
  });

  if (!set) {
    return NextResponse.json({ error: "Flashcard deck not found" }, { status: 404 });
  }

  await prisma.flashcardSet.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Deck deleted" });
}
