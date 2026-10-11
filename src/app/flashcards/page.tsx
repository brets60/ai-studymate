"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import {
  Layers,
  Plus,
  Play,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  Clock,
  BookOpen,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface FlashcardSetItem {
  id: string;
  title: string;
  createdAt: string;
  subject?: { id: string; name: string; color: string } | null;
  _count: { flashcards: number };
}

export default function FlashcardsPage() {
  const [sets, setSets] = useState<FlashcardSetItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  // AI Generator Form
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);

  // Manual Deck Form
  const [manualTitle, setManualTitle] = useState("");
  const [manualSubjectId, setManualSubjectId] = useState("");
  const [manualCards, setManualCards] = useState<Array<{ question: string; answer: string }>>([
    { question: "", answer: "" },
  ]);

  useEffect(() => {
    fetchDecksAndSubjects();
  }, []);

  const fetchDecksAndSubjects = async () => {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.all([
        fetch("/api/flashcards"),
        fetch("/api/subjects"),
      ]);
      if (fRes.ok) {
        const fData = await fRes.json();
        setSets(fData.sets || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSubjects(sData.subjects || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please specify a topic for the flashcard deck.");
      return;
    }

    setError("");
    setGenerating(true);

    const sub = subjects.find((s) => s.id === subjectId);

    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subjectId || undefined,
          subjectName: sub?.name || "General Academic",
          topic,
          count: Number(count),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate flashcard deck");
      }

      setShowAiModal(false);
      setTopic("");
      fetchDecksAndSubjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error generating deck");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateManualDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    const validCards = manualCards.filter((c) => c.question.trim() && c.answer.trim());
    if (validCards.length === 0) {
      setError("Please fill out at least one card question and answer.");
      return;
    }

    setError("");
    setGenerating(true);

    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle,
          subjectId: manualSubjectId || undefined,
          cards: validCards,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create deck");
      }

      setShowManualModal(false);
      setManualTitle("");
      setManualCards([{ question: "", answer: "" }]);
      fetchDecksAndSubjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating deck");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteDeck = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flashcard deck?")) return;
    try {
      await fetch(`/api/flashcards/${id}`, { method: "DELETE" });
      setSets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <Header
        title="Flashcards & Active Recall"
        subtitle="Spaced-repetition card decks to optimize long-term memory"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Create Manually
          </button>
          <button
            onClick={() => setShowAiModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>
        </div>
      </Header>

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* AI GENERATOR MODAL */}
        {showAiModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">AI Flashcard Generator</h3>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
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

              <form onSubmit={handleGenerateAiDeck} className="space-y-4">
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
                    Topic or Key Concept
                  </label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Organic Chemistry Functional Groups, French Revolution, Calculus Derivatives"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Number of Cards
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value={5}>5 High-Yield Cards</option>
                    <option value={10}>10 Cards (Comprehensive Deck)</option>
                    <option value={15}>15 Cards (Deep Recall Set)</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
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
                        <span>Generating Deck...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Flashcards</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MANUAL DECK CREATOR MODAL */}
        {showManualModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Create Flashcard Deck</h3>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
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

              <form onSubmit={handleCreateManualDeck} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Deck Title
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g., Biology Chapter 4 Vocabulary"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <select
                    value={manualSubjectId}
                    onChange={(e) => setManualSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Cards
                  </label>
                  {manualCards.map((card, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <input
                        type="text"
                        placeholder={`Question / Front (Card ${idx + 1})`}
                        value={card.question}
                        onChange={(e) => {
                          const updated = [...manualCards];
                          updated[idx].question = e.target.value;
                          setManualCards(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder={`Answer / Back (Card ${idx + 1})`}
                        value={card.answer}
                        onChange={(e) => {
                          const updated = [...manualCards];
                          updated[idx].answer = e.target.value;
                          setManualCards(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setManualCards([...manualCards, { question: "", answer: "" }])}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add another card
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    Save Flashcard Deck
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Decks Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Your Study Decks</h3>
            <span className="text-xs text-slate-400">{sets.length} decks available</span>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : sets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No flashcard decks yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Active recall is the most scientifically proven method for lasting retention. Generate
                or create a deck to get started!
              </p>
              <button
                onClick={() => setShowAiModal(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate with AI</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sets.map((set) => (
                <div
                  key={set.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {set.subject?.name || "General"}
                    </span>

                    <h4 className="text-base font-bold text-slate-900 line-clamp-2">{set.title}</h4>

                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{set._count?.flashcards || 0} Cards in Deck</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleDeleteDeck(set.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete deck"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/flashcards/${set.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Study Deck</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
