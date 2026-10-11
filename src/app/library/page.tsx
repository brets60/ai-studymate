"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import {
  FolderArchive,
  Search,
  Bot,
  FileText,
  HelpCircle,
  Layers,
  FileUp,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
} from "lucide-react";

interface LibraryData {
  conversations: Array<{
    id: string;
    title: string;
    updatedAt: string;
    subject?: { name: string } | null;
    _count: { messages: number };
  }>;
  notes: Array<{
    id: string;
    title: string;
    summary: string;
    updatedAt: string;
    subject?: { name: string } | null;
  }>;
  flashcardSets: Array<{
    id: string;
    title: string;
    createdAt: string;
    subject?: { name: string } | null;
    _count: { flashcards: number };
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    difficulty: string;
    questionCount: number;
    createdAt: string;
    subject?: { name: string } | null;
  }>;
  documents: Array<{
    id: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    createdAt: string;
    subject?: { name: string } | null;
  }>;
  counts: {
    total: number;
    conversations: number;
    notes: number;
    flashcardSets: number;
    quizzes: number;
    documents: number;
  };
}

interface Subject {
  id: string;
  name: string;
}

export default function LibraryPage() {
  const [data, setData] = useState<LibraryData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "conversations" | "notes" | "flashcards" | "quizzes" | "documents"
  >("all");

  useEffect(() => {
    fetchSubjects();
    fetchLibrary();
  }, [activeTab, selectedSubjectId]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const d = await res.json();
        setSubjects(d.subjects || []);
      }
    } catch {}
  };

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedSubjectId) params.set("subjectId", selectedSubjectId);
      if (activeTab !== "all") params.set("type", activeTab);

      const res = await fetch(`/api/library?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLibrary();
  };

  const handleDeleteItem = async (
    endpoint: string,
    id: string,
    title: string
  ) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      fetchLibrary();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <Header
        title="Personal Study Library"
        subtitle="Centralized repository of all your AI conversations, reviewer notes, exam decks, and files"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library by topic, title, or keyword..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-blue-500 outline-none"
            />
          </form>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-semibold text-slate-500">Subject:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", label: "All Items", count: data?.counts?.total },
            { key: "conversations", label: "AI Chats", count: data?.counts?.conversations },
            { key: "notes", label: "Notes & Summaries", count: data?.counts?.notes },
            { key: "flashcards", label: "Flashcards", count: data?.counts?.flashcardSets },
            { key: "quizzes", label: "Quizzes", count: data?.counts?.quizzes },
            { key: "documents", label: "Uploaded Files", count: data?.counts?.documents },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Grids */}
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Conversations */}
            {(activeTab === "all" || activeTab === "conversations") &&
              data?.conversations &&
              data.conversations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600" /> Saved AI Conversations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.conversations.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <Link
                            href="/tutor"
                            className="font-semibold text-xs text-slate-900 hover:text-blue-600 truncate block"
                          >
                            {c.title}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {c.subject?.name || "General"} • {c._count.messages} messages
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleDeleteItem("/api/conversations", c.id, c.title)
                          }
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Notes & Summaries */}
            {(activeTab === "all" || activeTab === "notes") &&
              data?.notes &&
              data.notes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" /> Study Notes & Reviewers
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-blue-600">
                              {n.subject?.name || "General"}
                            </span>
                            <button
                              onClick={() => handleDeleteItem("/api/notes", n.id, n.title)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h5 className="font-semibold text-xs text-slate-900">{n.title}</h5>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                            {n.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Flashcards */}
            {(activeTab === "all" || activeTab === "flashcards") &&
              data?.flashcardSets &&
              data.flashcardSets.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" /> Flashcard Decks
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.flashcardSets.map((f) => (
                      <div
                        key={f.id}
                        className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <Link
                            href={`/flashcards/${f.id}`}
                            className="font-semibold text-xs text-slate-900 hover:text-blue-600 truncate block"
                          >
                            {f.title}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {f.subject?.name || "General"} • {f._count.flashcards} cards
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteItem("/api/flashcards", f.id, f.title)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Quizzes */}
            {(activeTab === "all" || activeTab === "quizzes") &&
              data?.quizzes &&
              data.quizzes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-600" /> Generated Quizzes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.quizzes.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <Link
                            href={`/quizzes/${q.id}`}
                            className="font-semibold text-xs text-slate-900 hover:text-blue-600 truncate block"
                          >
                            {q.title}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {q.subject?.name || "General"} • {q.questionCount} questions
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteItem("/api/quizzes", q.id, q.title)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Documents */}
            {(activeTab === "all" || activeTab === "documents") &&
              data?.documents &&
              data.documents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-sky-600" /> Uploaded Academic Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.documents.map((d) => (
                      <div
                        key={d.id}
                        className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-xs text-slate-900 truncate">
                            {d.filename}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {(d.fileSize / 1024).toFixed(1)} KB • {d.subject?.name || "General"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteItem("/api/documents", d.id, d.filename)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {data?.counts?.total === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <FolderArchive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Your Study Library is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Saved conversations, summaries, flashcards, and uploaded textbooks will appear
                  here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
