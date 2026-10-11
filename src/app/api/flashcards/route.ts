import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateManualDeckSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subjectId: z.string().optional(),
  cards: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .min(1, "At least one card is required"),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");

  const sets = await prisma.flashcardSet.findMany({
    where: {
      userId: user.id,
      ...(subjectId ? { subjectId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      subject: true,
      _count: {
        select: { flashcards: true },
      },
    },
  });

  return NextResponse.json({ sets });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateManualDeckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, subjectId, cards } = parsed.data;

    const flashcardSet = await prisma.flashcardSet.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title,
        flashcards: {
          create: cards.map((c) => ({
            question: c.question,
            answer: c.answer,
            difficulty: "medium",
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
    console.error("Create manual deck error:", error);
    return NextResponse.json({ error: "Failed to create flashcard deck" }, { status: 500 });
  }
}
