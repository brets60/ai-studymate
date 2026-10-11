import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TaskCreateSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  subjectId: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const subjectId = searchParams.get("subjectId");

  const tasks = await prisma.studyTask.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(subjectId ? { subjectId } : {}),
    },
    orderBy: [
      { status: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      subject: true,
    },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = TaskCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, description, subjectId, dueDate, priority, status } = parsed.data;

    const task = await prisma.studyTask.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
