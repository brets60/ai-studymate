"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  questionType: string;
  options: string[];
}

interface QuizDetail {
  id: string;
  title: string;
  difficulty: string;
  subject?: { name: string } | null;
  questions: Question[];
}

interface ReviewItem {
  questionId: string;
  question: string;
  questionType: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
}

interface SubmissionResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  review: ReviewItem[];
}

export default function QuizTakingPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/quizzes/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Quiz not found");
        return r.json();
      })
      .then((data) => {
        if (data?.quiz) setQuiz(data.quiz);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelectAnswer = (qId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/quizzes/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission evaluation failed");
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error submitting quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  if (error || !quiz) {
    return (
      <AppShell>
        <div className="p-8 max-w-xl mx-auto text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Quiz Unavailable</h2>
          <p className="text-sm text-slate-500">{error || "Could not load examination details."}</p>
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Quizzes
          </Link>
        </div>
      </AppShell>
    );
  }

  const currentQ = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <AppShell>
      <Header
        title={quiz.title}
        subtitle={`${quiz.subject?.name || "General"} • ${quiz.difficulty.toUpperCase()} • ${totalQuestions} Questions`}
      >
        <Link
          href="/quizzes"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Exam</span>
        </Link>
      </Header>

      <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
        {/* POST-SUBMISSION REVIEW STAGE */}
        {result ? (
          <div className="space-y-8">
            {/* Score Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
                  result.percentage >= 80
                    ? "bg-emerald-100 text-emerald-600"
                    : result.percentage >= 60
                    ? "bg-blue-100 text-blue-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                <Award className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Examination Result
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                  {result.score} / {result.totalQuestions} ({result.percentage}%)
                </h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  {result.percentage >= 80
                    ? "Outstanding mastery! You have a solid grasp of these core principles."
                    : result.percentage >= 60
                    ? "Good effort! Review the explanations below to target your weak areas."
                    : "Room for growth. Read through the pedagogical explanations below to reinforce your foundations."}
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={handleRetake}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Examination</span>
                </button>
                <Link
                  href="/quizzes"
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Return to Quizzes
                </Link>
              </div>
            </div>

            {/* Questions Detailed Review List */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Pedagogical Review & Solutions</h3>

              {result.review.map((item, idx) => (
                <div
                  key={item.questionId}
                  className={`p-6 rounded-2xl border transition-all ${
                    item.isCorrect
                      ? "bg-emerald-50/30 border-emerald-200"
                      : "bg-rose-50/30 border-rose-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-xs font-bold text-slate-400">Question {idx + 1}</span>
                    {item.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>

                  <p className="text-base font-semibold text-slate-900 mb-4">{item.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-slate-400 block mb-1">Your Answer:</span>
                      <span
                        className={`font-semibold ${
                          item.isCorrect ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {item.selectedAnswer || "(No answer selected)"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-slate-400 block mb-1">Correct Answer:</span>
                      <span className="font-semibold text-emerald-700">{item.correctAnswer}</span>
                    </div>
                  </div>

                  {item.explanation && (
                    <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Explanation:
                      </span>
                      <MarkdownRenderer content={item.explanation} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE EXAM TAKING STAGE */
          <div className="space-y-6">
            {/* Progress Bar & Question Bubble Nav */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span>
                  {answeredCount} / {totalQuestions} Answered
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.round(((currentIndex + 1) / totalQuestions) * 100)}%` }}
                  className="bg-blue-600 h-full transition-all duration-300"
                />
              </div>

              {/* Question bubble numbers */}
              <div className="flex flex-wrap gap-2 pt-1">
                {quiz.questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = Boolean(answers[q.id]);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-blue-600 text-white shadow-xs scale-105"
                          : isAnswered
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Card */}
            {currentQ && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {currentQ.questionType.replace("_", " ")}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2 leading-snug">
                    {currentQ.question}
                  </h3>
                </div>

                {/* Multiple Choice Options */}
                {currentQ.questionType === "multiple_choice" && currentQ.options && (
                  <div className="space-y-3">
                    {currentQ.options.map((option, optIdx) => {
                      const isSelected = answers[currentQ.id] === option;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(currentQ.id, option)}
                          className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                          }`}
                        >
                          <span>{option}</span>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True or False Options */}
                {currentQ.questionType === "true_false" && (
                  <div className="grid grid-cols-2 gap-4">
                    {["True", "False"].map((tf) => {
                      const isSelected = answers[currentQ.id] === tf;
                      return (
                        <button
                          key={tf}
                          onClick={() => handleSelectAnswer(currentQ.id, tf)}
                          className={`p-5 rounded-xl border text-center font-bold text-base transition-all cursor-pointer ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                          }`}
                        >
                          {tf}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Identification / Short Answer Input */}
                {(currentQ.questionType === "identification" ||
                  currentQ.questionType === "short_answer") && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Your Answer:
                    </label>
                    <input
                      type="text"
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                      placeholder="Type your response..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  {currentIndex < totalQuestions - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={submitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Grading...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Submit & Score Exam</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
