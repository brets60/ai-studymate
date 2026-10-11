import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SubjectCreateSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  description: z.string().optional(),
  color: z.string().default("#2563eb"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          conversations: true,
          studyNotes: true,
          flashcardSets: true,
          quizzes: true,
          studyTasks: true,
        },
      },
    },
  });

  return NextResponse.json({ subjects });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = SubjectCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        description: parsed.data.description,
        color: parsed.data.color,
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error("Create subject error:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}
