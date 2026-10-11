import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const task = await prisma.studyTask.findFirst({
    where: { id, userId: user.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updated = await prisma.studyTask.update({
    where: { id },
    data: {
      title: body.title !== undefined ? body.title : task.title,
      description: body.description !== undefined ? body.description : task.description,
      dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : task.dueDate,
      priority: body.priority !== undefined ? body.priority : task.priority,
      status: body.status !== undefined ? body.status : task.status,
      subjectId: body.subjectId !== undefined ? body.subjectId : task.subjectId,
    },
    include: {
      subject: true,
    },
  });

  return NextResponse.json({ task: updated });
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

  const task = await prisma.studyTask.findFirst({
    where: { id, userId: user.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.studyTask.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Task deleted" });
}
