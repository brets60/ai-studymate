"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Award,
  Flame,
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface AnalyticsData {
  metrics: {
    totalStudyMinutes: number;
    totalStudyHours: number;
    completedTasksCount: number;
    pendingTasksCount: number;
    quizAverage: number;
    totalQuizzesAttempted: number;
    currentStreak: number;
  };
  weeklyActivity: Array<{ date: string; day: string; minutes: number }>;
  subjectPerformance: Array<{
    id: string;
    name: string;
    color: string;
    accuracy: number;
    studyMinutes: number;
    totalQuizzes: number;
    taskCount: number;
  }>;
  strongTopics: Array<{ name: string; accuracy: number }>;
  weakTopics: Array<{ name: string; accuracy: number }>;
  aiPlan?: {
    focusSubject: string;
    recommendedActions: string[];
    motivationalAdvice: string;
  };
}

export default function ProgressPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.metrics) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  const maxWeeklyMins = Math.max(
    60,
    ...(data?.weeklyActivity?.map((w) => w.minutes) || [60])
  );

  return (
    <AppShell>
      <Header
        title="Academic Progress & Analytics"
        subtitle="Empirical learning metrics, weekly study habits, and mastery tracking"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Core Metrics Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">Total Study Time</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {data?.metrics.totalStudyHours || 0}{" "}
              <span className="text-xs font-normal text-slate-400">hours</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {data?.metrics.totalStudyMinutes || 0} minutes logged
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold">Completed Tasks</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {data?.metrics.completedTasksCount || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {data?.metrics.pendingTasksCount || 0} assignments pending
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold">Quiz Average</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {data?.metrics.quizAverage || 0}%
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Across {data?.metrics.totalQuizzesAttempted || 0} exam attempts
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold">Study Streak</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {data?.metrics.currentStreak || 0}{" "}
              <span className="text-xs font-normal text-slate-400">days</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Consistent daily active learning</p>
          </div>
        </div>

        {/* Weekly Study Activity Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Study Minutes</h3>
              <p className="text-xs text-slate-500">Activity logged via focus sessions and study milestones</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              Last 7 Days
            </span>
          </div>

          <div className="flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2">
            {data?.weeklyActivity?.map((day) => {
              const heightPct = Math.min(100, Math.round((day.minutes / maxWeeklyMins) * 100));
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    {day.minutes > 0 ? `${day.minutes}m` : "0"}
                  </span>
                  <div className="w-full bg-slate-100 rounded-xl h-44 flex items-end p-1.5">
                    <div
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                      className={`w-full rounded-lg transition-all duration-500 ${
                        day.minutes > 0
                          ? "bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm"
                          : "bg-slate-200"
                      }`}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-Column: Subject Mastery & Strong/Weak Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Subject Performance */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900">Subject Breakdown & Accuracy</h3>

            {data?.subjectPerformance && data.subjectPerformance.length > 0 ? (
              <div className="space-y-4">
                {data.subjectPerformance.map((sub) => (
                  <div key={sub.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{sub.name}</span>
                      <span className="text-slate-500 font-semibold">
                        {sub.accuracy}% Accuracy ({sub.studyMinutes}m studied)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, sub.accuracy)}%` }}
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No subjects or quiz scores recorded yet.
              </p>
            )}
          </div>

          {/* Strong & Weak Areas */}
          <div className="lg:col-span-5 space-y-6">
            {/* Strong Topics */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <TrendingUp className="w-4 h-4" />
                <h4 className="text-sm font-bold">Strong Subject Areas</h4>
              </div>
              {data?.strongTopics && data.strongTopics.length > 0 ? (
                <div className="space-y-2">
                  {data.strongTopics.map((st, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs font-semibold text-emerald-900"
                    >
                      <span>{st.name}</span>
                      <span>{st.accuracy}% accuracy</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Complete practice exams to detect strong areas.</p>
              )}
            </div>

            {/* Weak Topics */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-700">
                <TrendingDown className="w-4 h-4" />
                <h4 className="text-sm font-bold">Focus & Review Needed</h4>
              </div>
              {data?.weakTopics && data.weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {data.weakTopics.map((wt, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between text-xs font-semibold text-amber-900"
                    >
                      <span>{wt.name}</span>
                      <span>{wt.accuracy}% accuracy</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Take practice exams to reveal areas for review.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
