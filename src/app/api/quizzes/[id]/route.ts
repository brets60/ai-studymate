import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const quiz = await prisma.quiz.findFirst({
    where: { id, userId: user.id },
    include: {
      subject: true,
      questions: {
        select: {
          id: true,
          question: true,
          questionType: true,
          options: true,
          // Intentionally omitting correctAnswer & explanation for academic integrity
        },
      },
      attempts: {
        orderBy: { completedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  // Parse options JSON strings to arrays
  const formattedQuestions = quiz.questions.map((q) => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : [],
  }));

  return NextResponse.json({
    quiz: {
      ...quiz,
      questions: formattedQuestions,
    },
  });
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

  const quiz = await prisma.quiz.findFirst({
    where: { id, userId: user.id },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  await prisma.quiz.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Quiz deleted" });
}
