import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SubmitQuizSchema = z.object({
  answers: z.record(z.string()), // questionId -> selectedAnswer
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
    const body = await req.json();
    const parsed = SubmitQuizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission payload" },
        { status: 400 }
      );
    }

    const { answers } = parsed.data;

    const quiz = await prisma.quiz.findFirst({
      where: { id, userId: user.id },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    let calculatedScore = 0;
    const evaluatedQuestions = quiz.questions.map((q) => {
      const selected = (answers[q.id] || "").trim();
      const target = q.correctAnswer.trim();

      // Flexible grading:
      // Exact match or lowercase normalized
      const isCorrect =
        selected.toLowerCase() === target.toLowerCase() ||
        (q.questionType === "identification" &&
          selected.toLowerCase().includes(target.toLowerCase()));

      if (isCorrect) {
        calculatedScore += 1;
      }

      return {
        questionId: q.id,
        question: q.question,
        questionType: q.questionType,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect,
      };
    });

    // Create the QuizAttempt in DB
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        score: calculatedScore,
        totalQuestions: quiz.questions.length,
        responses: {
          create: evaluatedQuestions.map((res) => ({
            questionId: res.questionId,
            selectedAnswer: res.selectedAnswer,
            isCorrect: res.isCorrect,
          })),
        },
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      score: calculatedScore,
      totalQuestions: quiz.questions.length,
      percentage: Math.round((calculatedScore / Math.max(1, quiz.questions.length)) * 100),
      review: evaluatedQuestions,
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate quiz submission" },
      { status: 500 }
    );
  }
}
