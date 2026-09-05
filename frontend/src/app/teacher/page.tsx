"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Assignment, Submission, TeachingAssignment, PagedResponse, TeacherDashboardStatsDto } from "@/lib/types";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  BookOpen,
  FileSpreadsheet,
  FileCheck,
  Building2,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Users,
  CalendarDays
} from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allotments, setAllotments] = useState<TeachingAssignment[]>([]);
  const [stats, setStats] = useState<TeacherDashboardStatsDto | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, submissionsRes, allotmentsRes, statsRes] = await Promise.all([
        api.get<PagedResponse<Assignment>>("/assignments?pageSize=50"),
        api.get<PagedResponse<Submission>>("/assignments/submissions?pageSize=50"),
        api.get<TeachingAssignment[]>("/assignments/my-allotments"),
        api.get<TeacherDashboardStatsDto>("/Dashboard/teacher"),
      ]);

      setAssignments(assignmentsRes.data.items || []);
      setSubmissions(submissionsRes.data.items || []);
      setAllotments(allotmentsRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load teacher dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const publishedCount = assignments.filter((a) => a.status === "Published").length;
  const pendingGradingCount = submissions.filter(
    (s) => s.status === "Submitted" || s.status === "Late" || s.status === "UnderReview"
  ).length;
  const uniqueClassCount = new Set(allotments.map((a) => a.classId)).size;

  const pendingSubmissions = submissions
    .filter((s) => s.status === "Submitted" || s.status === "Late")
    .slice(0, 5);

  const upcomingAssignments = assignments
    .filter((a) => a.status === "Published")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 p-8 text-white shadow-xl shadow-indigo-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-sky-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instructor Workspace</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Teacher"}!
            </h1>
            <p className="text-sky-100 text-sm max-w-xl">
              Track student submissions, publish curriculum tasks, and review pending coursework across all your assigned classrooms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/teacher/assignments">
              <button
                id="quick-create-assignment-btn"
                className="inline-flex items-center justify-center font-semibold rounded-lg px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-indigo-700 hover:bg-sky-50 shadow-md cursor-pointer focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create Task
              </button>
            </Link>
            <Link href="/teacher/submissions">
              <Button
                variant="outline"
                id="quick-grade-submissions-btn"
                className="border-white/40 text-white hover:bg-white/10 backdrop-blur-md cursor-pointer"
              >
                <FileCheck className="w-4 h-4 mr-1.5" /> Grade Submissions
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative ambient background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Assigned Classes"
          value={uniqueClassCount}
          subtitle={`${allotments.length} Subject Allocations`}
          icon={Building2}
          color="sky"
          loading={loading}
        />
        <StatCard
          title="Total Assignments"
          value={assignments.length}
          subtitle={`${publishedCount} Published Live`}
          icon={FileSpreadsheet}
          color="indigo"
          loading={loading}
        />
        <StatCard
          title="Pending Review"
          value={pendingGradingCount}
          subtitle="Submissions awaiting marks"
          icon={Clock}
          color="amber"
          loading={loading}
        />
        <StatCard
          title="Total Students"
          value={stats?.totalStudentsTaught || 0}
          subtitle="Across all assigned classes"
          icon={Users}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="Upcoming Exams"
          value={stats?.upcomingExams || 0}
          subtitle="Scheduled for your subjects"
          icon={CalendarDays}
          color="rose"
          loading={loading}
        />
      </div>

      {/* Two Column Layout: Assigned Classes & Pending Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Submissions Needing Attention + Upcoming Deadlines */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Submissions Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">
                    Submissions Awaiting Grading
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Latest student submissions that need evaluation
                  </p>
                </div>
              </div>
              <Link
                href="/teacher/submissions"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center space-x-1"
              >
                <span>View All ({pendingGradingCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
                  Loading pending submissions...
                </div>
              ) : pendingSubmissions.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    All caught up!
                  </p>
                  <p className="text-xs text-slate-500">
                    There are no pending submissions awaiting grading right now.
                  </p>
                </div>
              ) : (
                pendingSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {sub.studentName}
                        </span>
                        <Badge variant={sub.status === "Late" ? "error" : "warning"}>
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Assignment: <span className="font-medium text-slate-700 dark:text-slate-300">{sub.assignmentTitle}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    <Link href={`/teacher/submissions?gradeId=${sub.id}`}>
                      <Button size="sm" variant="primary" className="cursor-pointer shrink-0">
                        Grade Work
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Assignments Overview */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">
                    Active Tasks & Upcoming Deadlines
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Published coursework currently live for students
                  </p>
                </div>
              </div>
              <Link
                href="/teacher/assignments"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center space-x-1"
              >
                <span>Manage All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
                  Loading coursework...
                </div>
              ) : upcomingAssignments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No active published assignments found.
                </div>
              ) : (
                upcomingAssignments.map((a) => {
                  const isOverdue = new Date(a.deadline) < new Date();
                  return (
                    <div
                      key={a.id}
                      className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {a.title}
                          </span>
                          <Badge variant="info">{a.className}</Badge>
                          <Badge variant="neutral">{a.subjectName}</Badge>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className={isOverdue ? "text-rose-500 font-semibold" : ""}>
                              Deadline: {new Date(a.deadline).toLocaleDateString()}
                            </span>
                          </span>
                          <span>•</span>
                          <span>{a.submissionCount} Submissions</span>
                          <span>•</span>
                          <span>Max: {a.maxMarks} pts</span>
                        </div>
                      </div>

                      <Link href={`/teacher/submissions?assignmentId=${a.id}`}>
                        <Button size="sm" variant="outline" className="cursor-pointer shrink-0">
                          Submissions
                        </Button>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Assigned Classes & Subjects + Quick Actions */}
        <div className="space-y-8">
          {/* Assigned Classes */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  Teaching Allocations
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Classes and subjects allotted to you
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {loading ? (
                <div className="text-xs text-slate-400 animate-pulse">Loading allocations...</div>
              ) : allotments.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 text-center">
                  No teaching allocations found. Please contact the administrator.
                </div>
              ) : (
                allotments.map((allot) => (
                  <div
                    key={allot.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {allot.className}
                      </p>
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                        {allot.subjectName}
                      </p>
                    </div>
                    <Badge variant="neutral">Active</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tips / Policy Note */}
          <div className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-indigo-50/60 to-sky-50/30 dark:from-slate-900 dark:to-slate-850 space-y-2.5">
            <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>Grading Best Practices</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              When creating tasks, clearly mention submission requirements. You can evaluate late submissions with custom feedback and adjust awarded marks up to each task's configured Max Score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
