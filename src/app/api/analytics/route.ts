import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recommendStudyPlan } from "@/lib/gemini";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Study Sessions & Total Study Time
  const sessions = await prisma.studySession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    include: { subject: true },
  });

  const totalStudyMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // 2. Tasks & Completed assignments
  const tasks = await prisma.studyTask.findMany({
    where: { userId: user.id },
    include: { subject: true },
    orderBy: { dueDate: "asc" },
  });

  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
  const pendingTasksCount = tasks.filter((t) => t.status !== "completed").length;
  const upcomingDeadlines = tasks
    .filter((t) => t.status !== "completed" && t.dueDate)
    .slice(0, 5);

  const overdueTasks = tasks.filter((t) => {
    if (t.status === "completed" || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  });

  // 3. Quizzes & Attempts
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId: user.id },
    orderBy: { completedAt: "desc" },
    include: {
      quiz: {
        include: { subject: true },
      },
      responses: true,
    },
  });

  let totalQuestionsAnswered = 0;
  let totalCorrectAnswers = 0;
  quizAttempts.forEach((attempt) => {
    totalQuestionsAnswered += attempt.totalQuestions;
    totalCorrectAnswers += attempt.score;
  });

  const quizAverage =
    totalQuestionsAnswered > 0
      ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
      : 0;

  // Date helper using local year-month-date to prevent UTC midnight skew
  function toLocalDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 4. Weekly Study Activity (Last 7 days)
  const last7Days: { date: string; day: string; minutes: number }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dateStr = toLocalDateString(d);
    const dayName = dayNames[d.getDay()];

    const minutes = sessions
      .filter((s) => {
        const sDate = new Date(s.startedAt);
        return sDate >= d && sDate < nextD;
      })
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    last7Days.push({
      date: dateStr,
      day: dayName,
      minutes,
    });
  }

  // 5. Study Streaks (Consecutive active days)
  const activeDatesSet = new Set<string>();
  sessions.forEach((s) => activeDatesSet.add(toLocalDateString(new Date(s.startedAt))));
  tasks.filter((t) => t.status === "completed").forEach((t) => activeDatesSet.add(toLocalDateString(new Date(t.createdAt))));
  quizAttempts.forEach((q) => activeDatesSet.add(toLocalDateString(new Date(q.completedAt))));

  let currentStreak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  // Check today first; if not active yet today, check if yesterday was active
  const todayStr = toLocalDateString(checkDate);
  if (!activeDatesSet.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (activeDatesSet.has(toLocalDateString(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // 6. Subject Performance Breakdown
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
  });

  const subjectPerformance = subjects.map((sub) => {
    const subQuizzes = quizAttempts.filter((a) => a.quiz.subjectId === sub.id);
    const subQuestions = subQuizzes.reduce((s, a) => s + a.totalQuestions, 0);
    const subCorrect = subQuizzes.reduce((s, a) => s + a.score, 0);
    const accuracy = subQuestions > 0 ? Math.round((subCorrect / subQuestions) * 100) : 0;

    const subMinutes = sessions
      .filter((s) => s.subjectId === sub.id)
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    const subTasks = tasks.filter((t) => t.subjectId === sub.id);

    return {
      id: sub.id,
      name: sub.name,
      color: sub.color,
      accuracy,
      studyMinutes: subMinutes,
      totalQuizzes: subQuizzes.length,
      taskCount: subTasks.length,
    };
  });

  // Determine strong and weak topics
  const sortedByAccuracy = [...subjectPerformance].filter((s) => s.totalQuizzes > 0);
  sortedByAccuracy.sort((a, b) => b.accuracy - a.accuracy);

  const strongTopics = sortedByAccuracy.slice(0, 2).map((s) => ({
    name: s.name,
    accuracy: s.accuracy,
  }));

  const weakTopics = sortedByAccuracy.reverse().slice(0, 2).map((s) => ({
    name: s.name,
    accuracy: s.accuracy,
  }));

  // 7. AI Recommendation
  const aiPlan = await recommendStudyPlan({
    tasks: tasks.map((t) => ({
      title: t.title,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      priority: t.priority,
      status: t.status,
    })),
    quizScores: quizAttempts.map((q) => ({
      title: q.quiz.title,
      score: q.score,
      total: q.totalQuestions,
    })),
    studyHoursTotal: Math.round(totalStudyMinutes / 60),
    educationLevel: user.educationLevel,
  });

  return NextResponse.json({
    metrics: {
      totalStudyMinutes,
      totalStudyHours: Number((totalStudyMinutes / 60).toFixed(1)),
      completedTasksCount,
      pendingTasksCount,
      quizAverage,
      totalQuizzesAttempted: quizAttempts.length,
      currentStreak,
    },
    upcomingDeadlines,
    overdueTasks,
    recentAttempts: quizAttempts.slice(0, 5),
    weeklyActivity: last7Days,
    subjectPerformance,
    strongTopics,
    weakTopics,
    aiPlan,
  });
}
