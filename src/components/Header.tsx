"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Sparkles, BookOpen, Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    fetch("/api/tasks?status=pending")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tasks) {
          const now = new Date();
          const count = data.tasks.filter(
            (t: { dueDate?: string | null }) => t.dueDate && new Date(t.dueDate) < now
          ).length;
          setOverdueCount(count);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"));
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Clean, unobstructed Page Title */}
      <div className="flex flex-col min-w-0 pr-2">
        <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 hidden md:block truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Actions, Notifications & Main Menu Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {children}

        {/* Quick Ask AI button (desktop) */}
        <Link
          href="/tutor"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Tutor</span>
        </Link>

        {/* Library shortcut (desktop) */}
        <Link
          href="/library"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors hidden sm:inline-flex"
          title="My Study Library"
        >
          <BookOpen className="w-4 h-4" />
        </Link>

        {/* Notifications / overdue alert badge */}
        <Link
          href="/planner"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
          title={overdueCount > 0 ? `${overdueCount} overdue assignments` : "No overdue assignments"}
        >
          <Bell className="w-4 h-4" />
          {overdueCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </Link>

        {/* Main Menu Button on the Right: Clean, touch-friendly, never blocks text */}
        <button
          onClick={handleToggleSidebar}
          className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl border border-slate-200/90 shadow-2xs transition-colors"
          aria-label="Open Navigation Menu"
          title="Open Main Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
