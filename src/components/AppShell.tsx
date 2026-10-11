"use client";

import React from "react";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300 min-w-0">
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
