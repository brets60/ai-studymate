"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import {
  Layers,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Loader2,
  AlertCircle,
  Eye,
  Award,
} from "lucide-react";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
  nextReviewAt: string;
}

interface FlashcardSetDetail {
  id: string;
  title: string;
  subject?: { name: string } | null;
  flashcards: Flashcard[];
}

export default function FlashcardsStudyPage() {
  const params = useParams();
  const id = params.id as string;

  const [set, setSet] = useState<FlashcardSetDetail | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/flashcards/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Deck not found");
        return r.json();
      })
      .then((data) => {
        if (data?.set) {
          setSet(data.set);
          setCards(data.set.flashcards || []);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleRateCard = async (difficulty: "hard" | "medium" | "easy" | "mastered") => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    // Send rating to spaced-repetition API
    fetch(`/api/flashcards/card/${currentCard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty }),
    }).catch(console.error);

    // Advance to next card or complete session
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
      // Auto log a 10 min active recall session
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: 10 }),
      }).catch(console.error);
    }
  };

  const handleRestart = () => {
    setCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);
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

  if (error || !set || cards.length === 0) {
    return (
      <AppShell>
        <div className="p-8 max-w-xl mx-auto text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Deck Empty or Unavailable</h2>
          <p className="text-sm text-slate-500">
            {error || "This deck has no flashcards to study yet."}
          </p>
          <Link
            href="/flashcards"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Flashcards
          </Link>
        </div>
      </AppShell>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <AppShell>
      <Header
        title={set.title}
        subtitle={`${set.subject?.name || "General"} • Active Recall Mode`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Shuffle cards"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
          <Link
            href="/flashcards"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </Link>
        </div>
      </Header>

      <div className="p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
        {completed ? (
          /* SESSION COMPLETED CARD */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900">Deck Completed!</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              You reviewed all {cards.length} cards in this deck. Spaced-repetition review intervals
              have been updated based on your recall ratings.
            </p>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Review Again</span>
              </button>
              <Link
                href="/flashcards"
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Return to Decks
              </Link>
            </div>
          </div>
        ) : (
          /* ACTIVE CARD VIEW */
          <div className="space-y-6">
            {/* Progress counter */}
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>
                Card {currentIndex + 1} of {cards.length}
              </span>
              <span>Click card or button below to flip</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.round(((currentIndex + 1) / cards.length) * 100)}%` }}
                className="bg-blue-600 h-full transition-all duration-300"
              />
            </div>

            {/* Flashcard container */}
            <div
              onClick={handleFlip}
              className={`min-h-[300px] sm:min-h-[340px] rounded-3xl p-8 sm:p-10 shadow-sm border transition-all duration-300 cursor-pointer flex flex-col justify-between select-none ${
                isFlipped
                  ? "bg-blue-50/60 border-blue-200"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isFlipped
                      ? "bg-blue-200/70 text-blue-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isFlipped ? "Answer / Back" : "Question / Front"}
                </span>

                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Eye className="w-3.5 h-3.5" />
                  {isFlipped ? "Showing Back" : "Click to Flip"}
                </span>
              </div>

              {/* Card Main Text */}
              <div className="my-auto py-6 text-center">
                <p
                  className={`font-semibold leading-relaxed transition-all ${
                    isFlipped
                      ? "text-lg sm:text-xl text-slate-900 font-medium"
                      : "text-xl sm:text-2xl text-slate-900 font-bold"
                  }`}
                >
                  {isFlipped ? currentCard.answer : currentCard.question}
                </p>
              </div>

              <div className="text-center text-xs text-slate-400">
                {isFlipped ? "Rate your recall ease below" : "Tap card to reveal answer"}
              </div>
            </div>

            {/* Rating Controls (Shown after flipping) */}
            {isFlipped ? (
              <div className="space-y-2 pt-2 animate-fadeIn">
                <p className="text-xs font-bold text-center text-slate-500 uppercase tracking-wider">
                  How well did you recall this?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleRateCard("hard")}
                    className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Hard (1d)
                  </button>
                  <button
                    onClick={() => handleRateCard("medium")}
                    className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Medium (3d)
                  </button>
                  <button
                    onClick={() => handleRateCard("easy")}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Easy (7d)
                  </button>
                  <button
                    onClick={() => handleRateCard("mastered")}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Mastered (14d)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleFlip}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show Answer</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
