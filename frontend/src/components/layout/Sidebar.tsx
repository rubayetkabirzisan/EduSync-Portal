"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  UserCheck,
  FileSpreadsheet,
  FileCheck,
  GraduationCap,
  LogOut,
  Sparkles,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const adminLinks = [
    { href: "/admin", label: "Dashboard Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Directory", icon: Users },
    { href: "/admin/classes", label: "Class Management", icon: Building2 },
    { href: "/admin/subjects", label: "Subject Catalog", icon: BookOpen },
    { href: "/admin/teaching-assignments", label: "Teacher Allotment", icon: UserCheck },
    { href: "/admin/assignments", label: "All Assignments", icon: FileSpreadsheet },
    { href: "/admin/submissions", label: "All Submissions", icon: FileCheck },
  ];

  const teacherLinks = [
    { href: "/teacher", label: "Teacher Dashboard", icon: LayoutDashboard },
    { href: "/teacher/assignments", label: "My Assignments", icon: FileSpreadsheet },
    { href: "/teacher/submissions", label: "Submissions & Grading", icon: FileCheck },
  ];

  const studentLinks = [
    { href: "/student", label: "Student Dashboard", icon: LayoutDashboard },
    { href: "/student/assignments", label: "My Class Tasks", icon: FileSpreadsheet },
    { href: "/student/submissions", label: "My Submissions", icon: GraduationCap },
  ];

  const links =
    user.role === "Admin"
      ? adminLinks
      : user.role === "Teacher"
      ? teacherLinks
      : studentLinks;

  const roleColor = {
    Admin: "bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    Teacher: "bg-sky-600/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    Student: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  }[user.role];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 select-none transition-colors">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">EduSync</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 -mt-1">
              Portal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-semibold shadow-xs dark:bg-indigo-600 dark:border-transparent dark:text-white dark:shadow-indigo-600/30"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-indigo-600 dark:text-white" : "text-slate-400 dark:text-slate-400"
                }`}
              />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Badge & Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-xs dark:shadow-none space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${roleColor}`}
            >
              {user.role}
            </span>
            <button
              id="sidebar-logout-btn"
              onClick={logout}
              className="flex items-center space-x-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
