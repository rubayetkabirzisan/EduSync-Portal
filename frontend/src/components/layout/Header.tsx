"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { Moon, Sun, Bell, Menu, X, Shield, BookOpen, GraduationCap } from "lucide-react";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Header({ onToggleMobileMenu, isMobileMenuOpen }: HeaderProps) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const roleIcon = {
    Admin: <Shield className="w-4 h-4 text-purple-500" />,
    Teacher: <BookOpen className="w-4 h-4 text-sky-500" />,
    Student: <GraduationCap className="w-4 h-4 text-emerald-500" />,
  }[user?.role || "Student"];

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors">
      <div className="flex items-center space-x-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">{roleIcon}</div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {user?.role} Portal
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Dark Mode Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Icon (Decorative) */}
        <div className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
        </div>
      </div>
    </header>
  );
}
