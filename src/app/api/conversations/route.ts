import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      subject: true,
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { messages: true },
      },
    },
  });

  return NextResponse.json({ conversations });
}
