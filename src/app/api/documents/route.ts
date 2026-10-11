import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");

  const documents = await prisma.uploadedDocument.findMany({
    where: {
      userId: user.id,
      ...(subjectId ? { subjectId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      subject: true,
    },
  });

  return NextResponse.json({ documents });
}
