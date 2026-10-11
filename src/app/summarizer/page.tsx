"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  FileText,
  Upload,
  Sparkles,
  Save,
  Copy,
  Check,
  Download,
  Layers,
  BookOpen,
  HelpCircle,
  Loader2,
  AlertCircle,
  FileUp,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface SummaryResult {
  title: string;
  summary: string;
  keyConcepts: Array<{ concept: string; definition: string }>;
  keyTerms: string[];
  reviewerNotes: string[];
  flashcards: Array<{ question: string; answer: string }>;
  practiceQuestions: Array<{
    question: string;
    questionType: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

export default function SummarizerPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoGenerateFlashcards, setAutoGenerateFlashcards] = useState(true);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.subjects) setSubjects(data.subjects);
      })
      .catch(() => {});
  }, []);

  const handleSummarize = async () => {
    if (!lessonContent.trim() || lessonContent.length < 20) {
      setError("Please paste at least 20 characters of lesson text to summarize.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    const subjectObj = subjects.find((s) => s.id === selectedSubjectId);

    try {
      const res = await fetch("/api/notes/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: lessonContent,
          subject: subjectObj?.name || "General Academic",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setResult(data.summaryResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error summarizing notes");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds 10MB limit.");
      return;
    }

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    if (selectedSubjectId) formData.append("subjectId", selectedSubjectId);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      if (data.document?.textContent) {
        setLessonContent(data.document.textContent);
        setSuccessMsg(`Document "${file.name}" processed! Content loaded into editor.`);
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "File processing failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!result) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title,
          originalContent: lessonContent,
          summary: result.summary,
          subjectId: selectedSubjectId || undefined,
          keyConcepts: result.keyConcepts,
          keyTerms: result.keyTerms,
          createFlashcards: autoGenerateFlashcards,
          flashcardsList: result.flashcards,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save note");
      }

      setSuccessMsg(
        autoGenerateFlashcards
          ? "Note and Flashcard Deck saved to your Library!"
          : "Note saved to your Library!"
      );
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setSaving(false);
    }
  };

  const handleCopySummary = () => {
    if (!result) return;
    const textToCopy = `# ${result.title}\n\n${result.summary}\n\n### Key Concepts:\n${result.keyConcepts
      .map((c) => `- **${c.concept}**: ${c.definition}`)
      .join("\n")}\n\n### High-Yield Reviewer Notes:\n${result.reviewerNotes
      .map((n) => `- ${n}`)
      .join("\n")}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportText = () => {
    if (!result) return;
    const fullContent = `# ${result.title}\n\n${result.summary}\n\n## Key Concepts\n${result.keyConcepts
      .map((c) => `* **${c.concept}**: ${c.definition}`)
      .join("\n")}\n\n## Reviewer Notes\n${result.reviewerNotes
      .map((r) => `* ${r}`)
      .join("\n")}\n\n## Practice Questions\n${result.practiceQuestions
      .map((q, i) => `${i + 1}. ${q.question}\nAnswer: ${q.correctAnswer}\nExplanation: ${q.explanation}`)
      .join("\n\n")}`;

    const blob = new Blob([fullContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <Header
        title="AI Notes Summarizer"
        subtitle="Transform raw lecture notes, slides, and textbooks into structured reviewers and flashcards"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input and Upload */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Source Lesson Notes</h3>
                {/* Subject Selector */}
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Paste lecture text, syllabus, or reading material:
                </label>
                <textarea
                  rows={12}
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  placeholder="Paste textbook passages, bulleted lecture notes, transcription, or formulas here..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 leading-relaxed font-sans resize-y"
                />
              </div>

              {/* Document Upload Button */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Or upload document (PDF, TXT, MD, Images):
                </label>
                <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50/50">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Extracting text from file...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-4 h-4 text-blue-600" />
                      <span>Choose file from device (Max 10MB)</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.md,.csv,.json,image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Options */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoFlash"
                  checked={autoGenerateFlashcards}
                  onChange={(e) => setAutoGenerateFlashcards(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoFlash" className="text-xs text-slate-600 font-medium">
                  Automatically create flashcards deck when saving note
                </label>
              </div>

              {/* Action Button */}
              <button
                onClick={handleSummarize}
                disabled={loading || uploading || !lessonContent.trim()}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Reviewer & Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Generated Summary & Reviewer */}
          <div className="lg:col-span-7 space-y-6">
            {result ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                      Generated Reviewer
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{result.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySummary}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Copy full notes"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      onClick={handleExportText}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Export as Markdown"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>

                    <button
                      onClick={handleSaveNote}
                      disabled={saving}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save to Library</span>
                    </button>
                  </div>
                </div>

                {/* Synthesis Section */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Concise Summary
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 text-slate-800 text-sm leading-relaxed">
                    <MarkdownRenderer content={result.summary} />
                  </div>
                </div>

                {/* Key Concepts and Definitions */}
                {result.keyConcepts && result.keyConcepts.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Key Concepts & Definitions
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {result.keyConcepts.map((item, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 text-xs text-slate-800"
                        >
                          <span className="font-bold text-blue-900 block mb-1">{item.concept}</span>
                          <span className="text-slate-700 leading-relaxed">{item.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* High-Yield Reviewer Notes */}
                {result.reviewerNotes && result.reviewerNotes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      High-Yield Reviewer Bullets
                    </h4>
                    <ul className="space-y-2">
                      {result.reviewerNotes.map((note, i) => (
                        <li
                          key={i}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed flex items-start gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Flashcards Preview */}
                {result.flashcards && result.flashcards.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Extracted Flashcards ({result.flashcards.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.flashcards.slice(0, 4).map((fc, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs text-xs space-y-1.5"
                        >
                          <p className="font-semibold text-slate-900">Q: {fc.question}</p>
                          <p className="text-slate-600">A: {fc.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No notes summarized yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Paste your coursework, lecture transcript, or upload a textbook PDF on the left to
                  generate structured summaries, high-yield reviewer notes, and flashcard sets.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
