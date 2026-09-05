"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ChatbotWidget } from "../chat/ChatbotWidget";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex flex-col w-64 max-w-[80vw] bg-white dark:bg-slate-900 animate-in slide-in-from-left duration-200">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          isMobileMenuOpen={mobileMenuOpen}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="flex-1 p-6 overflow-x-hidden">
            <div className="max-w-7xl mx-auto h-full">{children}</div>
          </div>
        </main>
      </div>
      <ChatbotWidget />
    </div>
  );
}
