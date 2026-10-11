import Link from "next/link";
import {
  GraduationCap,
  Bot,
  FileText,
  HelpCircle,
  Layers,
  CalendarCheck,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="h-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-xl tracking-tight">
              Study<span className="text-blue-600">Mate</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              AI Academic Assistant
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-6 sm:px-12 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Built for High School, Senior High & University Students</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Master difficult subjects with a personalized{" "}
            <span className="text-blue-600">AI Academic Tutor</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            AI StudyMate teaches step-by-step concepts, summarizes lecture notes, generates practice
            examinations with instant grading, organizes assignments, and accelerates active recall.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-base flex items-center gap-2"
            >
              <span>Start Learning for Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="px-7 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl shadow-xs transition-all text-base"
            >
              Explore Dashboard
            </Link>
          </div>

          {/* Value Props Row */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Socratic pedagogical tutoring</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Real-time practice exams & scoring</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Spaced-repetition flashcards</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Private academic document storage</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-white border-y border-slate-200/80 px-6 sm:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Everything you need to excel in your studies
              </h2>
              <p className="mt-3 text-slate-500 text-sm sm:text-base">
                Structured academic tools crafted specifically for deeper understanding and durable memory.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">AI Academic Tutor</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Ask math, science, literature, or history questions. Select from 6 response modes
                  including Step-by-Step, Real Examples, and Socratic Guided Learning.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">AI Notes Summarizer</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Paste lecture notes or upload PDFs. Automatically extract key concepts, high-yield
                  reviewer notes, vocabulary terms, and flashcard sets.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">AI Exam Generator</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Generate multiple-choice, true/false, and identification quizzes. Answer questions
                  interactively, get instant scores, and study comprehensive explanations.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Spaced Repetition Flashcards</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Review flashcards with smart spaced-repetition intervals. Mark cards as difficult or
                  mastered to optimize memory retention for finals.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Academic Planner</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Track homework, exam schedules, and deadlines. Prioritize tasks and get overdue alerts
                  so you never miss an assignment.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Progress Analytics</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Monitor total study time, quiz averages, weekly study streaks, and discover strong vs
                  weak subject areas backed by real database records.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-slate-50 border-t border-slate-200 px-6 sm:px-12 text-center text-xs text-slate-500">
        <p>© 2026 AI StudyMate. Engineered for academic excellence and ethical learning.</p>
      </footer>
    </div>
  );
}
