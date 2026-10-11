import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const UpdateSettingsSchema = z.object({
  fullName: z.string().min(2).optional(),
  educationLevel: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  dailyStudyGoal: z.number().min(10).max(600).optional(),
  notificationPreferences: z.string().optional(),
  geminiApiKey: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  const activeKey = (
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ""
  ).trim();

  let activeProvider = "none";
  if (activeKey.startsWith("gsk_")) activeProvider = "Groq (Llama / GPT-OSS)";
  else if (activeKey.startsWith("AIzaSy")) activeProvider = "Google Gemini";
  else if (activeKey.startsWith("sk-")) activeProvider = "OpenAI";
  else if (activeKey !== "") activeProvider = "Active";

  return NextResponse.json({
    user,
    settings: settings || {
      theme: "light",
      dailyStudyGoal: 60,
      notificationPreferences: '{"email":true,"deadlines":true,"reminders":true}',
    },
    hasServerGeminiKey: Boolean(activeKey !== ""),
    activeProvider,
  });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      fullName,
      educationLevel,
      theme,
      dailyStudyGoal,
      notificationPreferences,
      geminiApiKey,
    } = parsed.data;

    // If student provided an API Key (Groq, Gemini, or OpenAI)
    if (geminiApiKey !== undefined && geminiApiKey.trim() !== "") {
      const cleanKey = geminiApiKey.trim();
      if (cleanKey.startsWith("gsk_")) {
        process.env.GROQ_API_KEY = cleanKey;
        process.env.GEMINI_API_KEY = cleanKey;
      } else if (cleanKey.startsWith("sk-")) {
        process.env.OPENAI_API_KEY = cleanKey;
      } else {
        process.env.GEMINI_API_KEY = cleanKey;
      }

      try {
        const envPath = path.join(process.cwd(), ".env");
        let envContent = await fs.readFile(envPath, "utf-8").catch(() => "");
        
        if (cleanKey.startsWith("gsk_")) {
          if (envContent.includes("GROQ_API_KEY=")) {
            envContent = envContent.replace(/GROQ_API_KEY=.*/, `GROQ_API_KEY="${cleanKey}"`);
          } else {
            envContent += `\nGROQ_API_KEY="${cleanKey}"\n`;
          }
          if (envContent.includes("GEMINI_API_KEY=")) {
            envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY="${cleanKey}"`);
          }
        } else {
          if (envContent.includes("GEMINI_API_KEY=")) {
            envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY="${cleanKey}"`);
          } else {
            envContent += `\nGEMINI_API_KEY="${cleanKey}"\n`;
          }
        }

        await fs.writeFile(envPath, envContent, "utf-8");
      } catch (err) {
        console.warn("Could not write to .env file:", err);
      }
    }

    // Update User
    if (fullName !== undefined || educationLevel !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(educationLevel ? { educationLevel } : {}),
        },
      });
    }

    // Upsert UserSettings
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        theme: theme || "light",
        dailyStudyGoal: dailyStudyGoal || 60,
        notificationPreferences:
          notificationPreferences ||
          '{"email":true,"deadlines":true,"reminders":true}',
      },
      update: {
        ...(theme ? { theme } : {}),
        ...(dailyStudyGoal ? { dailyStudyGoal } : {}),
        ...(notificationPreferences ? { notificationPreferences } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: fullName || user.fullName,
        educationLevel: educationLevel || user.educationLevel,
      },
      settings,
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
