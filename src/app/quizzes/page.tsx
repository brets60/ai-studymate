"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import {
  HelpCircle,
  Plus,
  Play,
  Trash2,
  Award,
  Sparkles,
  Loader2,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface QuizItem {
  id: string;
  title: string;
  difficulty: string;
  questionCount: number;
  createdAt: string;
  subject?: { id: string; name: string; color: string } | null;
  attempts: Array<{
    id: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }>;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [mcqChecked, setMcqChecked] = useState(true);
  const [tfChecked, setTfChecked] = useState(true);
  const [identChecked, setIdentChecked] = useState(false);

  useEffect(() => {
    fetchQuizzesAndSubjects();
  }, []);

  const fetchQuizzesAndSubjects = async () => {
    setLoading(true);
    try {
      const [qRes, sRes] = await Promise.all([
        fetch("/api/quizzes"),
        fetch("/api/subjects"),
      ]);
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuizzes(qData.quizzes || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSubjects(sData.subjects || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please specify a topic for the quiz.");
      return;
    }

    const questionTypes: string[] = [];
    if (mcqChecked) questionTypes.push("multiple_choice");
    if (tfChecked) questionTypes.push("true_false");
    if (identChecked) questionTypes.push("identification");

    if (questionTypes.length === 0) {
      setError("Please select at least one question type.");
      return;
    }

    setError("");
    setGenerating(true);

    const subjectObj = subjects.find((s) => s.id === subjectId);

    try {
      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subjectId || undefined,
          subjectName: subjectObj?.name || "General Academic",
          topic,
          questionCount: Number(questionCount),
          difficulty,
          questionTypes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate examination");
      }

      setShowModal(false);
      setTopic("");
      fetchQuizzesAndSubjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error generating quiz");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Are you sure you want to delete this practice quiz?")) return;
    try {
      await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <Header
        title="AI Quiz & Examination Generator"
        subtitle="Practice examinations, instant grading, and pedagogical reviews"
      >
        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate New Quiz</span>
        </button>
      </Header>

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Generator Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Configure Practice Exam</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleGenerateQuiz} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">General Academic Studies</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Topic or Specific Lesson Unit
                  </label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Photosynthesis, Newton's 2nd Law, World War I, Quadratic Equations"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Question Count
                    </label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value={3}>3 Questions (Quick Drill)</option>
                      <option value={5}>5 Questions (Standard Practice)</option>
                      <option value={10}>10 Questions (Midterm Review)</option>
                      <option value={15}>15 Questions (Full Mock Exam)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="easy">Easy (Foundations)</option>
                      <option value="medium">Medium (Standard)</option>
                      <option value="hard">Hard (Advanced Rigor)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Question Types
                  </label>
                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={mcqChecked}
                        onChange={(e) => setMcqChecked(e.target.checked)}
                        className="rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span>Multiple Choice</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={tfChecked}
                        onChange={(e) => setTfChecked(e.target.checked)}
                        className="rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span>True or False</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={identChecked}
                        onChange={(e) => setIdentChecked(e.target.checked)}
                        className="rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span>Identification</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Exam...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Quiz</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quizzes Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Your Practice Examinations</h3>
            <span className="text-xs text-slate-400">{quizzes.length} sets available</span>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No practice exams created yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Click below to generate your first AI exam with interactive grading and step-by-step
                pedagogical feedback.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Practice Exam</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => {
                const latestAttempt = quiz.attempts?.[0];
                const pct = latestAttempt
                  ? Math.round(
                      (latestAttempt.score / Math.max(1, latestAttempt.totalQuestions)) * 100
                    )
                  : null;

                return (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {quiz.subject?.name || "General"}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            quiz.difficulty === "hard"
                              ? "bg-rose-50 text-rose-700"
                              : quiz.difficulty === "medium"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {quiz.difficulty}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 line-clamp-2">
                        {quiz.title}
                      </h4>

                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span>{quiz.questionCount} Questions</span>
                        <span>•</span>
                        <span>{quiz.attempts?.length || 0} Attempts</span>
                      </div>

                      {latestAttempt && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Latest Score:</span>
                          <span
                            className={`font-bold ${
                              (pct || 0) >= 80
                                ? "text-emerald-600"
                                : (pct || 0) >= 60
                                ? "text-blue-600"
                                : "text-amber-600"
                            }`}
                          >
                            {pct}% ({latestAttempt.score}/{latestAttempt.totalQuestions})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/quizzes/${quiz.id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{latestAttempt ? "Retake Exam" : "Take Exam"}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
