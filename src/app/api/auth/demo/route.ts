import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  try {
    const demoEmail = "scholar@studymate.edu";
    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!user) {
      const hashedPassword = await hashPassword("studymate2026");
      user = await prisma.user.create({
        data: {
          fullName: "College Scholar",
          email: demoEmail,
          password: hashedPassword,
          educationLevel: "College / University",
          settings: {
            create: {
              theme: "light",
              dailyStudyGoal: 60,
            },
          },
          subjects: {
            create: [
              { name: "Mathematics (Calculus)", color: "#2563eb", description: "Derivatives, Integrals, Linear Algebra" },
              { name: "Computer Science", color: "#10b981", description: "Algorithms, Data Structures, OOP" },
              { name: "Natural Sciences (Physics)", color: "#f59e0b", description: "Mechanics, Thermodynamics, Circuits" },
              { name: "Humanities & Philosophy", color: "#8b5cf6", description: "Ethics, Critical Analysis, Logic" },
            ],
          },
        },
      });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      educationLevel: user.educationLevel,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        educationLevel: user.educationLevel,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      secure: false,
    });

    return response;
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: "Failed to log in as demo student" }, { status: 500 });
  }
}
