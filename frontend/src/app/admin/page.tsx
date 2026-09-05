"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { AdminDashboardStatsDto } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Building2,
  BookOpen,
  UserCheck,
  FileSpreadsheet,
  FileCheck,
  PlusCircle,
  ArrowRight,
  Sparkles,
  CalendarDays,
  Banknote
} from "lucide-react";

interface OverviewStats {
  usersCount: number;
  classesCount: number;
  subjectsCount: number;
  teachingAssignmentsCount: number;
  assignmentsCount: number;
  submissionsCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<OverviewStats & AdminDashboardStatsDto>({
    usersCount: 0,
    classesCount: 0,
    subjectsCount: 0,
    teachingAssignmentsCount: 0,
    assignmentsCount: 0,
    submissionsCount: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    pendingLeaves: 0,
    pendingScholarships: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, classesRes, subjectsRes, taRes, assignRes, subRes, dashRes] =
          await Promise.all([
            api.get("/admin/users?pageSize=1"),
            api.get("/admin/classes?pageSize=1"),
            api.get("/admin/subjects?pageSize=1"),
            api.get("/admin/teaching-assignments?pageSize=1"),
            api.get("/admin/assignments?pageSize=1"),
            api.get("/admin/submissions?pageSize=1"),
            api.get<AdminDashboardStatsDto>("/Dashboard/admin"),
          ]);

        setStats({
          usersCount: usersRes.data.totalCount || 0,
          classesCount: classesRes.data.totalCount || 0,
          subjectsCount: subjectsRes.data.totalCount || 0,
          teachingAssignmentsCount: taRes.data.totalCount || 0,
          assignmentsCount: assignRes.data.totalCount || 0,
          submissionsCount: subRes.data.totalCount || 0,
          ...dashRes.data
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Registered Users",
      value: stats.usersCount,
      icon: Users,
      color: "from-blue-600 to-indigo-600",
      href: "/admin/users",
      badge: "Accounts",
    },
    {
      title: "Active Classes",
      value: stats.classesCount,
      icon: Building2,
      color: "from-emerald-600 to-teal-600",
      href: "/admin/classes",
      badge: "Cohorts",
    },
    {
      title: "Curriculum Subjects",
      value: stats.subjectsCount,
      icon: BookOpen,
      color: "from-amber-600 to-orange-600",
      href: "/admin/subjects",
      badge: "Catalog",
    },
    {
      title: "Teacher Allotments",
      value: stats.teachingAssignmentsCount,
      icon: UserCheck,
      color: "from-purple-600 to-pink-600",
      href: "/admin/teaching-assignments",
      badge: "Mappings",
    },
    {
      title: "Total Assignments",
      value: stats.assignmentsCount,
      icon: FileSpreadsheet,
      color: "from-cyan-600 to-blue-600",
      href: "/admin/assignments",
      badge: "Tasks",
    },
    {
      title: "Student Submissions",
      value: stats.submissionsCount,
      icon: FileCheck,
      color: "from-rose-600 to-red-600",
      href: "/admin/submissions",
      badge: "Responses",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      icon: CalendarDays,
      color: "from-pink-600 to-rose-600",
      href: "/admin/leaves",
      badge: "Applications",
    },
    {
      title: "Pending Scholarships",
      value: stats.pendingScholarships,
      icon: Banknote,
      color: "from-lime-600 to-emerald-600",
      href: "/admin/scholarships",
      badge: "Financial Aid",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white shadow-xl border border-indigo-700/40">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Administrative Control Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            System Administration Overview
          </h1>
          <p className="text-xs md:text-sm text-indigo-200/90 leading-relaxed">
            Manage users, classrooms, curriculum subjects, and instructor allocations across the entire institution.
          </p>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} href={card.href} className="group block">
              <Card className="h-full hover:border-indigo-500/50 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {card.title}
                    </span>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {isLoading ? "..." : card.value}
                    </p>
                    <Badge variant="neutral" size="sm">
                      {card.badge}
                    </Badge>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Manage {card.badge}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <Card title="Quick Management Actions" subtitle="Fast shortcuts to frequent administration tasks">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Add New User</p>
              <p className="text-[11px] text-slate-500">Student, Teacher, Admin</p>
            </div>
          </Link>

          <Link
            href="/admin/classes"
            className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Create Class</p>
              <p className="text-[11px] text-slate-500">New grade / section</p>
            </div>
          </Link>

          <Link
            href="/admin/subjects"
            className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Add Subject</p>
              <p className="text-[11px] text-slate-500">Course code & title</p>
            </div>
          </Link>

          <Link
            href="/admin/teaching-assignments"
            className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Assign Teacher</p>
              <p className="text-[11px] text-slate-500">Class + Subject allocation</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
