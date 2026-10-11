import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { academicTutor, TutorMessage } from "@/lib/gemini";
import { z } from "zod";

const ChatRequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, "Message cannot be empty"),
  subjectId: z.string().optional(),
  responseMode: z
    .enum(["simple", "detailed", "step_by_step", "example", "quiz_me", "socratic"])
    .default("simple"),
  documentContext: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { conversationId, message, subjectId, responseMode, documentContext } = parsed.data;

    let conversation;
    let subjectName = "General Academic";

    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: user.id },
        include: {
          subject: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (conversation?.subject) {
        subjectName = conversation.subject.name;
      }
    } else {
      if (subjectId) {
        const sub = await prisma.subject.findFirst({
          where: { id: subjectId, userId: user.id },
        });
        if (sub) subjectName = sub.name;
      }

      // Generate a title from the first message
      const title = message.slice(0, 45) + (message.length > 45 ? "..." : "");

      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          subjectId: subjectId || null,
          title,
        },
        include: {
          subject: true,
          messages: true,
        },
      });
    }

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Save user's question message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    // Prepare history for context
    const history: TutorMessage[] = (conversation.messages || [])
      .reverse()
      .map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

    // Call AI Tutor service
    const tutorResponse = await academicTutor({
      prompt: message,
      subject: subjectName,
      educationLevel: user.educationLevel,
      responseMode,
      history,
      documentContext,
    });

    // Save assistant's answer message
    const savedAssistantMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: tutorResponse.text,
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      title: conversation.title,
      message: savedAssistantMsg,
      suggestedFollowUps: tutorResponse.suggestedFollowUps,
    });
  } catch (error) {
    console.error("AI Tutor chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate tutor response. Please try again." },
      { status: 500 }
    );
  }
}
