import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

const RegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  educationLevel: z.string().default("High School"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { fullName, email, password, educationLevel } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        password: hashedPassword,
        educationLevel,
        settings: {
          create: {
            theme: "light",
            dailyStudyGoal: 60,
          },
        },
        // Seed default subjects for student convenience
        subjects: {
          create: [
            { name: "Mathematics", color: "#2563eb", description: "Algebra, Calculus, Geometry" },
            { name: "Science", color: "#10b981", description: "Biology, Chemistry, Physics" },
            { name: "History & Social Studies", color: "#f59e0b", description: "World & National History" },
            { name: "Literature & Language", color: "#8b5cf6", description: "Reading, Writing, Grammar" },
          ],
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        educationLevel: true,
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      educationLevel: user.educationLevel,
    });

    const response = NextResponse.json({
      success: true,
      user,
    });

    const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https:");

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: isHttps,
    });

    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    const detail = error?.message || String(error);
    return NextResponse.json(
      { error: `Database error: ${detail}` },
      { status: 500 }
    );
  }
}
