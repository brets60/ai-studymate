"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import {
  Bot,
  FileText,
  HelpCircle,
  Layers,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Plus,
} from "lucide-react";

interface DashboardData {
  metrics: {
    totalStudyMinutes: number;
    totalStudyHours: number;
    completedTasksCount: number;
    pendingTasksCount: number;
    quizAverage: number;
    totalQuizzesAttempted: number;
    currentStreak: number;
  };
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    priority: string;
    status: string;
    subject?: { name: string; color: string } | null;
  }>;
  overdueTasks: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    priority: string;
    subject?: { name: string; color: string } | null;
  }>;
  recentAttempts: Array<{
    id: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
    quiz: { title: string; subject?: { name: string } | null };
  }>;
  weeklyActivity: Array<{ date: string; day: string; minutes: number }>;
  subjectPerformance: Array<{
    id: string;
    name: string;
    color: string;
    accuracy: number;
    studyMinutes: number;
  }>;
  aiPlan?: {
    focusSubject: string;
    recommendedActions: string[];
    motivationalAdvice: string;
  };
}

interface UserProfile {
  id: string;
  fullName: string;
  educationLevel: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/analytics").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([userData, analyticsData]) => {
        if (userData?.user) setUser(userData.user);
        if (analyticsData?.metrics) setData(analyticsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const maxMinutesInWeek = Math.max(
    60,
    ...(data?.weeklyActivity?.map((w) => w.minutes) || [60])
  );

  return (
    <AppShell>
      <Header
        title="Dashboard"
        subtitle="Your personalized academic workspace and learning trajectory"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-medium">
              <span>{user?.educationLevel || "Student"} Scholar</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getGreeting()}, {user?.fullName || "Scholar"}!
            </h2>
            <p className="text-blue-100 text-sm max-w-xl">
              {data?.aiPlan?.motivationalAdvice ||
                "Ready to master today's coursework? Pick a quick action or consult your AI Tutor below."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tutor"
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-blue-600" />
              <span>Ask AI Tutor</span>
            </Link>
            <Link
              href="/quizzes"
              className="px-4 py-2.5 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-white font-medium text-sm transition-all border border-white/20 flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Practice Exam</span>
            </Link>
          </div>
        </div>

        {/* Overdue alert banner if any */}
        {data?.overdueTasks && data.overdueTasks.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">
                  You have {data.overdueTasks.length} overdue assignment(s)!
                </p>
                <p className="text-xs text-amber-700">
                  Past deadline: {data.overdueTasks.map((t) => t.title).slice(0, 2).join(", ")}
                </p>
              </div>
            </div>
            <Link
              href="/planner"
              className="text-xs font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3 py-1.5 rounded-lg shrink-0 transition-colors"
            >
              View Planner
            </Link>
          </div>
        )}

        {/* Core Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Study Time</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {data?.metrics.totalStudyHours || 0}{" "}
                <span className="text-xs font-normal text-slate-500">hrs</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Assignments Done</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {data?.metrics.completedTasksCount || 0}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Quiz Average</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {data?.metrics.quizAverage || 0}%
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Study Streak</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {data?.metrics.currentStreak || 0}{" "}
                <span className="text-xs font-normal text-slate-500">days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Quick Academic Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/tutor"
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Ask AI Tutor</span>
            </Link>

            <Link
              href="/summarizer"
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition-all group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Summarize Lesson</span>
            </Link>

            <Link
              href="/quizzes"
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-sm transition-all group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Generate Quiz</span>
            </Link>

            <Link
              href="/flashcards"
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-sm transition-all group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Study Flashcards</span>
            </Link>

            <Link
              href="/planner"
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-sm transition-all group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Add Assignment</span>
            </Link>

            <Link
              href="/library"
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800">My Library</span>
            </Link>
          </div>
        </div>

        {/* Two-Column Layout: Activity & Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Study Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Weekly Study Activity</h3>
                <p className="text-xs text-slate-500">Tracked minutes studied over the last 7 days</p>
              </div>
              <Link
                href="/progress"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Full Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex-1 flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2">
              {data?.weeklyActivity?.map((day) => {
                const heightPct = Math.min(100, Math.round((day.minutes / maxMinutesInWeek) * 100));
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      {day.minutes > 0 ? `${day.minutes}m` : "0"}
                    </span>
                    <div className="w-full bg-slate-100 rounded-lg h-36 flex items-end p-1">
                      <div
                        style={{ height: `${Math.max(6, heightPct)}%` }}
                        className={`w-full rounded-md transition-all duration-500 ${
                          day.minutes > 0
                            ? "bg-gradient-to-t from-blue-600 to-blue-400 shadow-xs"
                            : "bg-slate-200"
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{day.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Recommended Study Plan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recommended Focus</h3>
                  <span className="text-xs font-semibold text-blue-600">
                    {data?.aiPlan?.focusSubject || "General Coursework"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {data?.aiPlan?.recommendedActions?.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/tutor"
              className="mt-6 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Ask Tutor for Study Strategy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Upcoming Deadlines & Recent Exam Attempts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upcoming Deadlines</h3>
                <p className="text-xs text-slate-500">Tasks and project due dates</p>
              </div>
              <Link
                href="/planner"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.upcomingDeadlines.map((task) => (
                  <div key={task.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-400">
                        {task.subject?.name ? `${task.subject.name} • ` : ""}
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider shrink-0
                        ${
                          task.priority === "urgent" || task.priority === "high"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700"
                        }
                      `}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No upcoming deadlines recorded yet.
                <div className="mt-3">
                  <Link
                    href="/planner"
                    className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add your first assignment
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recent Quiz Attempts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Quiz Performance</h3>
                <p className="text-xs text-slate-500">Latest examination results</p>
              </div>
              <Link
                href="/quizzes"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Practice more</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.recentAttempts && data.recentAttempts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.recentAttempts.map((att) => {
                  const pct = Math.round((att.score / Math.max(1, att.totalQuestions)) * 100);
                  return (
                    <div key={att.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {att.quiz.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(att.completedAt).toLocaleDateString()} • {att.score} /{" "}
                          {att.totalQuestions} questions correct
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-sm font-bold ${
                            pct >= 80
                              ? "text-emerald-600"
                              : pct >= 60
                              ? "text-blue-600"
                              : "text-amber-600"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No quiz attempts taken yet.
                <div className="mt-3">
                  <Link
                    href="/quizzes"
                    className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Generate a practice examination
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
