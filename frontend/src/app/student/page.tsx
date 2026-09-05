"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Assignment, Submission, PagedResponse, StudentDashboardStatsDto } from "@/lib/types";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  GraduationCap,
  FileSpreadsheet,
  FileCheck,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Calendar,
  Send,
  MessageSquare,
  BookOpen,
  CalendarDays,
  Percent,
  Banknote
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<StudentDashboardStatsDto | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, submissionsRes, statsRes] = await Promise.all([
        api.get<PagedResponse<Assignment>>("/student/assignments?pageSize=50"),
        api.get<PagedResponse<Submission>>("/student/submissions?pageSize=50"),
        api.get<StudentDashboardStatsDto>("/Dashboard/student"),
      ]);

      setAssignments(assignmentsRes.data.items || []);
      setSubmissions(submissionsRes.data.items || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load student dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Map submissions by assignmentId
  const submissionMap = new Map<string, Submission>(
    submissions.map((s) => [s.assignmentId, s])
  );

  // Compute stats
  const totalTasks = assignments.length;
  const submittedCount = submissions.length;
  const pendingTasks = assignments.filter((a) => !submissionMap.has(a.id));
  const gradedSubmissions = submissions.filter((s) => s.status === "Graded" && s.marks !== null && s.marks !== undefined);

  const averageGrade =
    gradedSubmissions.length > 0
      ? Math.round(
          (gradedSubmissions.reduce((acc, curr) => acc + (curr.marks || 0) / curr.maxMarks, 0) /
            gradedSubmissions.length) *
            100
        )
      : 0;

  // Urgent pending tasks sorted by closest deadline
  const urgentTasks = pendingTasks
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  // Recent graded submissions with feedback
  const recentFeedback = gradedSubmissions
    .filter((s) => s.feedback)
    .sort((a, b) => new Date(b.gradedAt || b.submittedAt).getTime() - new Date(a.gradedAt || a.submittedAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-8 text-white shadow-xl shadow-emerald-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Learning Center</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || "Student"}!
            </h1>
            <p className="text-emerald-100 text-sm max-w-xl">
              Track your coursework assignments, check submission deadlines, and review teacher feedback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/student/assignments">
              <button
                id="view-tasks-btn"
                className="inline-flex items-center justify-center font-semibold rounded-lg px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-emerald-700 hover:bg-emerald-50 shadow-md cursor-pointer focus:ring-emerald-500"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" /> View Class Tasks
              </button>
            </Link>
            <Link href="/student/submissions">
              <Button
                variant="outline"
                id="view-grades-btn"
                className="border-white/40 text-white hover:bg-white/10 backdrop-blur-md cursor-pointer"
              >
                <Award className="w-4 h-4 mr-1.5" /> My Submissions
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Class Tasks"
          value={totalTasks}
          subtitle="Coursework assigned"
          icon={FileSpreadsheet}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="Pending Submissions"
          value={pendingTasks.length}
          subtitle="Tasks to be completed"
          icon={Clock}
          color="amber"
          loading={loading}
        />
        <StatCard
          title="Submitted Work"
          value={submittedCount}
          subtitle={`${gradedSubmissions.length} Graded by teacher`}
          icon={FileCheck}
          color="indigo"
          loading={loading}
        />
        <StatCard
          title="Average Score"
          value={gradedSubmissions.length > 0 ? `${averageGrade}%` : "N/A"}
          subtitle={gradedSubmissions.length > 0 ? "Overall coursework average" : "No graded tasks yet"}
          icon={Award}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Enrolled Courses"
          value={stats?.enrolledCourses || 0}
          subtitle="Total subjects enrolled"
          icon={BookOpen}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="Upcoming Exams"
          value={stats?.upcomingExams || 0}
          subtitle="Scheduled in the future"
          icon={CalendarDays}
          color="amber"
          loading={loading}
        />
        <StatCard
          title="Attendance"
          value={`${stats?.averageAttendancePercentage || 0}%`}
          subtitle="Average present percentage"
          icon={Percent}
          color="indigo"
          loading={loading}
        />
        <StatCard
          title="Scholarship"
          value={stats?.activeScholarshipStatus || "None"}
          subtitle="Current active application"
          icon={Banknote}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Two Column Layout: Urgent Tasks & Graded Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Tasks Due Soon */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">
                    Pending Tasks Due Soon
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assignments requiring your submission before deadline
                  </p>
                </div>
              </div>
              <Link
                href="/student/assignments"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center space-x-1"
              >
                <span>View All ({pendingTasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
                  Loading class tasks...
                </div>
              ) : urgentTasks.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    All tasks completed!
                  </p>
                  <p className="text-xs text-slate-500">
                    You have submitted all published coursework for your class.
                  </p>
                </div>
              ) : (
                urgentTasks.map((task) => {
                  const deadlineDate = new Date(task.deadline);
                  const isOverdue = deadlineDate < new Date();

                  return (
                    <div
                      key={task.id}
                      className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {task.title}
                          </span>
                          <Badge variant="neutral">{task.subjectName}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {task.description || "No instructions provided."}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className={isOverdue ? "text-rose-500 font-semibold" : ""}>
                              Deadline: {deadlineDate.toLocaleDateString()} at{" "}
                              {deadlineDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </span>
                          <span>•</span>
                          <span>Max: {task.maxMarks} pts</span>
                        </div>
                      </div>

                      <Link href={`/student/assignments?submitId=${task.id}`}>
                        <Button size="sm" variant="primary" className="cursor-pointer shrink-0">
                          <Send className="w-3.5 h-3.5 mr-1" /> Submit
                        </Button>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Teacher Feedback & Tips */}
        <div className="space-y-8">
          {/* Recent Feedback */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  Teacher Feedback
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recent notes on graded assignments
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {loading ? (
                <div className="text-xs text-slate-400 animate-pulse">Loading feedback...</div>
              ) : recentFeedback.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 text-center">
                  No graded feedback yet. Feedback from your teachers will appear here after grading.
                </div>
              ) : (
                recentFeedback.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {sub.assignmentTitle}
                      </p>
                      <Badge variant="success">
                        {sub.marks} / {sub.maxMarks} pts
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{sub.feedback}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Student Study Tip */}
          <div className="p-5 rounded-2xl border border-emerald-100 dark:border-emerald-950/60 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-slate-900 dark:to-slate-850 space-y-2.5">
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>Submission Guidelines</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Submit your answers before the deadline. If the assignment allows resubmissions, you can update your answer until the teacher finishes grading or the deadline closes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
