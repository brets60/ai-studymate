import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RecordSessionSchema = z.object({
  subjectId: z.string().optional(),
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.studySession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 30,
    include: { subject: true },
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = RecordSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { subjectId, durationMinutes, startedAt, endedAt } = parsed.data;

    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        durationMinutes,
        startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - durationMinutes * 60000),
        endedAt: endedAt ? new Date(endedAt) : new Date(),
      },
      include: { subject: true },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Record session error:", error);
    return NextResponse.json({ error: "Failed to record study session" }, { status: 500 });
  }
}
