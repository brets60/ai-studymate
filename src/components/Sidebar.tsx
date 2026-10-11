"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  FileText,
  HelpCircle,
  Layers,
  CalendarCheck,
  FolderArchive,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  Timer,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Download,
} from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  educationLevel: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Focus Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);

  useEffect(() => {
    // Load current user
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerActive && timerSeconds === 0) {
      setTimerActive(false);
      // Auto log 25 min session
      const durationMinutes = Math.round(initialSeconds / 60);
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes }),
      }).catch(console.error);
      alert("🎉 Great focus session! 25 minutes logged to your study progress.");
      setTimerSeconds(initialSeconds);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerSeconds, initialSeconds]);

  const handleStopTimer = async () => {
    if (!timerActive) return;
    const elapsedMinutes = Math.max(1, Math.round((initialSeconds - timerSeconds) / 60));
    setTimerActive(false);
    if (confirm(`Stop timer and log ${elapsedMinutes} minute(s) to your study record?`)) {
      try {
        await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ durationMinutes: elapsedMinutes }),
        });
        window.location.reload();
      } catch (e) {
        console.error(e);
      }
    }
    setTimerSeconds(initialSeconds);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "AI Tutor", href: "/tutor", icon: Bot },
    { label: "Notes Summarizer", href: "/summarizer", icon: FileText },
    { label: "Quiz Generator", href: "/quizzes", icon: HelpCircle },
    { label: "Flashcards", href: "/flashcards", icon: Layers },
    { label: "Study Planner", href: "/planner", icon: CalendarCheck },
    { label: "My Library", href: "/library", icon: FolderArchive },
    { label: "Progress", href: "/progress", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    const handleClose = () => setMobileOpen(false);
    window.addEventListener("toggle-mobile-sidebar", handleToggle);
    window.addEventListener("close-mobile-sidebar", handleClose);
    return () => {
      window.removeEventListener("toggle-mobile-sidebar", handleToggle);
      window.removeEventListener("close-mobile-sidebar", handleClose);
    };
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo and Brand */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                  Study<span className="text-blue-600">Mate</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  AI Academic Tutor
                </span>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button inside drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors group relative
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}

          <a
            href="/api/download/apk"
            download="ai-studymate.apk"
            title="Download Android APK"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-purple-700 bg-purple-50/80 hover:bg-purple-100 transition-colors mt-2"
          >
            <Download className="w-5 h-5 shrink-0 text-purple-600" />
            {!collapsed && <span>Download APK (Android)</span>}
          </a>

          <a
            href="/api/download"
            download="ai-studymate-full-source.zip"
            title="Download full project source code ZIP"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 transition-colors mt-1"
          >
            <Download className="w-5 h-5 shrink-0 text-emerald-600" />
            {!collapsed && <span>Download Code (ZIP)</span>}
          </a>
        </nav>

        {/* Focus Study Session Quick Widget */}
        {!collapsed && (
          <div className="mx-3 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-blue-600" /> Focus Session
              </span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {formatTimer(timerSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!timerActive ? (
                <button
                  onClick={() => setTimerActive(true)}
                  className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 shadow-xs"
                >
                  <Play className="w-3 h-3 fill-current" /> Start Study
                </button>
              ) : (
                <button
                  onClick={handleStopTimer}
                  className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 shadow-xs"
                >
                  <Square className="w-3 h-3 fill-current" /> Log & Stop
                </button>
              )}
            </div>
          </div>
        )}

        {/* User profile & logout footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-sm shrink-0">
              {user?.fullName?.charAt(0) || "S"}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate">
                  {user?.fullName || "Student"}
                </span>
                <span className="text-xs text-slate-400 truncate">
                  {user?.educationLevel || "High School"}
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
