"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import {
  Settings,
  Save,
  Key,
  Check,
  AlertCircle,
  Loader2,
  User,
  Shield,
  Zap,
  ExternalLink,
  Download,
} from "lucide-react";

interface UserSettingsData {
  theme: string;
  dailyStudyGoal: number;
  notificationPreferences: string;
}

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  educationLevel: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettingsData>({
    theme: "light",
    dailyStudyGoal: 60,
    notificationPreferences: '{"email":true,"deadlines":true,"reminders":true}',
  });
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);
  const [activeProvider, setActiveProvider] = useState("none");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [educationLevel, setEducationLevel] = useState("College / University");
  const [dailyGoal, setDailyGoal] = useState(60);
  const [theme, setTheme] = useState("light");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setProfile(data.user);
          setFullName(data.user.fullName);
          setEducationLevel(data.user.educationLevel);
        }
        if (data?.settings) {
          setSettings(data.settings);
          setDailyGoal(data.settings.dailyStudyGoal);
          setTheme(data.settings.theme);
        }
        if (data?.hasServerGeminiKey !== undefined) {
          setHasServerGeminiKey(data.hasServerGeminiKey);
        }
        if (data?.activeProvider) {
          setActiveProvider(data.activeProvider);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          educationLevel,
          dailyStudyGoal: Number(dailyGoal),
          theme,
          geminiApiKey: geminiKeyInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      if (geminiKeyInput.trim()) {
        setHasServerGeminiKey(true);
        if (geminiKeyInput.startsWith("gsk_")) {
          setActiveProvider("Groq (Llama / GPT-OSS)");
        } else if (geminiKeyInput.startsWith("AIzaSy")) {
          setActiveProvider("Google Gemini");
        } else if (geminiKeyInput.startsWith("sk-")) {
          setActiveProvider("OpenAI");
        }
        setGeminiKeyInput("");
      }

      setSuccessMsg("Settings updated and AI engine connected successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
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

  return (
    <AppShell>
      <Header
        title="Settings & AI Configuration"
        subtitle="Configure your academic profile, study goals, and connect your AI engine"
      />

      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Student Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Student Profile</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-400 bg-slate-50 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="Junior High School">Junior High School</option>
                  <option value="Senior High School">Senior High School</option>
                  <option value="College / University">College / University</option>
                  <option value="Graduate Studies">Graduate Studies</option>
                  <option value="Board / Certification Exam Prep">
                    Board / Certification Exam Prep
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Daily Study Goal (Minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* AI Service & Provider Integration Status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <Key className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">AI Integration Engine</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" /> Multi-Provider AI Brain
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Powers conversational tutoring, step-by-step calculus solving, and practice exams.
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start sm:self-auto ${
                    hasServerGeminiKey
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {hasServerGeminiKey
                    ? `🟢 Live AI Online (${activeProvider})`
                    : "Standard Offline Mode"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  AI Engine Key (Groq, Gemini, or OpenAI)
                </label>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder={
                    hasServerGeminiKey
                      ? "•••••••••••••••••••••••••••••••• (Active key connected)"
                      : "Paste key: gsk_... (Groq) or AIzaSy... (Gemini) or sk-... (OpenAI)"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center justify-between font-bold text-purple-900">
                    <span>⚡ Groq Cloud (Recommended - Free)</span>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 hover:text-purple-800 inline-flex items-center gap-0.5"
                    >
                      <span>Get Free Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    100% free, 500 tokens/sec, no credit card required. Keys start with <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-800 font-mono">gsk_...</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span>🔷 Google AI Studio</span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                    >
                      <span>Get Free Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Google Gemini 1.5 Flash. Keys start with <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 font-mono">AIzaSy...</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download & Mobile Installation Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <Download className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Download & Mobile Installation</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Native Android APK */}
              <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
                    🤖 Android App (APK - Direct Install)
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    Install the native Android APK directly on your phone. Hardware-accelerated with camera/document uploads and offline mode.
                  </p>
                </div>
                <a
                  href="/api/download/apk"
                  download="ai-studymate.apk"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start mt-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK (5.2 MB)</span>
                </a>
              </div>

              {/* Option 2: Mobile PWA App Install */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                <span className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                  📲 Install as PWA (Android / iPhone)
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You can also add AI StudyMate directly onto your phone home screen:
                </p>
                <ul className="text-xs text-slate-700 list-disc list-inside space-y-1 pt-1">
                  <li><strong>Android:</strong> Tap <strong>⋮</strong> &rarr; <strong>&quot;Install app&quot;</strong>.</li>
                  <li><strong>iPhone:</strong> Tap <strong>Share</strong> &rarr; <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                </ul>
              </div>

              {/* Option 3: Full Source Code ZIP */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                    📦 Full Project Source Code (ZIP)
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    Download the complete full-stack project archive (Next.js 15, Prisma schemas, Android project, and tests).
                  </p>
                </div>
                <a
                  href="/api/download"
                  download="ai-studymate-full-source.zip"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start mt-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Source ZIP</span>
                </a>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
