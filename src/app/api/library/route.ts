import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const subjectId = searchParams.get("subjectId") || undefined;
  const type = searchParams.get("type") || "all"; // all | conversations | notes | flashcards | quizzes | documents

  // Fetch all categories for this user
  const [conversations, notes, flashcardSets, quizzes, documents] = await Promise.all([
    type === "all" || type === "conversations"
      ? prisma.conversation.findMany({
          where: {
            userId: user.id,
            ...(subjectId ? { subjectId } : {}),
            ...(q ? { title: { contains: q } } : {}),
          },
          include: { subject: true, _count: { select: { messages: true } } },
          orderBy: { updatedAt: "desc" },
        })
      : [],

    type === "all" || type === "notes"
      ? prisma.studyNote.findMany({
          where: {
            userId: user.id,
            ...(subjectId ? { subjectId } : {}),
            ...(q
              ? {
                  OR: [
                    { title: { contains: q } },
                    { summary: { contains: q } },
                  ],
                }
              : {}),
          },
          include: { subject: true },
          orderBy: { updatedAt: "desc" },
        })
      : [],

    type === "all" || type === "flashcards"
      ? prisma.flashcardSet.findMany({
          where: {
            userId: user.id,
            ...(subjectId ? { subjectId } : {}),
            ...(q ? { title: { contains: q } } : {}),
          },
          include: { subject: true, _count: { select: { flashcards: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],

    type === "all" || type === "quizzes"
      ? prisma.quiz.findMany({
          where: {
            userId: user.id,
            ...(subjectId ? { subjectId } : {}),
            ...(q ? { title: { contains: q } } : {}),
          },
          include: {
            subject: true,
            _count: { select: { questions: true, attempts: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [],

    type === "all" || type === "documents"
      ? prisma.uploadedDocument.findMany({
          where: {
            userId: user.id,
            ...(subjectId ? { subjectId } : {}),
            ...(q ? { filename: { contains: q } } : {}),
          },
          include: { subject: true },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  return NextResponse.json({
    conversations,
    notes,
    flashcardSets,
    quizzes,
    documents,
    counts: {
      conversations: conversations.length,
      notes: notes.length,
      flashcardSets: flashcardSets.length,
      quizzes: quizzes.length,
      documents: documents.length,
      total:
        conversations.length +
        notes.length +
        flashcardSets.length +
        quizzes.length +
        documents.length,
    },
  });
}
