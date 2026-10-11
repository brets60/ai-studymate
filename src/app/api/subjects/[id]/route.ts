import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const subject = await prisma.subject.findFirst({
    where: { id, userId: user.id },
  });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found or access denied" }, { status: 404 });
  }

  await prisma.subject.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Subject deleted" });
}
