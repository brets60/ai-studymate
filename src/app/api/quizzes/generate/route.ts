import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuiz } from "@/lib/gemini";
import { z } from "zod";

const QuizRequestSchema = z.object({
  subjectId: z.string().optional(),
  subjectName: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  questionCount: z.number().min(1).max(20).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  questionTypes: z
    .array(z.enum(["multiple_choice", "true_false", "identification", "short_answer"]))
    .default(["multiple_choice", "true_false"]),
  documentContext: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = QuizRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      subjectId,
      subjectName,
      topic,
      questionCount,
      difficulty,
      questionTypes,
      documentContext,
    } = parsed.data;

    // Call AI to generate structured quiz
    const generated = await generateQuiz({
      subject: subjectName,
      topic,
      questionCount,
      difficulty,
      questionTypes,
      documentContext,
    });

    // Save quiz in database
    const quiz = await prisma.quiz.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title: generated.title || `${subjectName}: ${topic} Quiz`,
        difficulty,
        questionCount: generated.questions.length,
        questions: {
          create: generated.questions.map((q) => ({
            question: q.question,
            questionType: q.questionType,
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        },
      },
      include: {
        subject: true,
        _count: { select: { questions: true } },
      },
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error("Generate quiz error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz. Please try again." },
      { status: 500 }
    );
  }
}
