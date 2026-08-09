"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Assignment, Submission, PagedResponse } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/Card";
import {
  FileSpreadsheet,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Edit2,
  Eye,
  Award,
  BookOpen,
  User,
} from "lucide-react";

function StudentAssignmentsContent() {
  const searchParams = useSearchParams();
  const initialSubmitId = searchParams.get("submitId");

  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // View Grade Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

  useEffect(() => {
    fetchAssignmentsAndSubmissions();
  }, [page, search]);

  const fetchAssignmentsAndSubmissions = async () => {
    try {
      setLoading(true);
      let query = `/student/assignments?page=${page}&pageSize=10`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const [assignmentsRes, submissionsRes] = await Promise.all([
        api.get<PagedResponse<Assignment>>(query),
        api.get<PagedResponse<Submission>>("/student/submissions?pageSize=100"),
      ]);

      const items = assignmentsRes.data.items || [];
      const subItems = submissionsRes.data.items || [];

      setAssignments(items);
      setSubmissions(subItems);
      setTotalCount(assignmentsRes.data.totalCount || 0);

      // Auto-open modal if submitId query param is present
      if (initialSubmitId && !selectedAssignment) {
        const found = items.find((a) => a.id === initialSubmitId);
        if (found) {
          const sub = subItems.find((s) => s.assignmentId === found.id);
          handleOpenSubmitModal(found, sub || null);
        }
      }
    } catch (err) {
      console.error("Failed to load student assignments:", err);
      showToast("Failed to load class assignments", "error");
    } finally {
      setLoading(false);
    }
  };

  const submissionMap = new Map<string, Submission>(
    submissions.map((s) => [s.assignmentId, s])
  );

  const handleOpenSubmitModal = (assignment: Assignment, existing: Submission | null) => {
    setSelectedAssignment(assignment);
    setExistingSubmission(existing);
    setSubmissionContent(existing ? existing.content : "");
    setIsSubmitModalOpen(true);
  };

  const handleOpenGradeModal = (assignment: Assignment, submission: Submission) => {
    setSelectedAssignment(assignment);
    setExistingSubmission(submission);
    setIsGradeModalOpen(true);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionContent.trim()) {
      showToast("Please enter your answer or submission content", "warning");
      return;
    }

    try {
      setSubmitting(true);
      if (existingSubmission) {
        // Update existing submission
        await api.put(`/student/submissions/${existingSubmission.id}`, {
          content: submissionContent.trim(),
        });
        showToast("Submission updated successfully!", "success");
      } else {
        // Create new submission
        await api.post("/student/submissions", {
          assignmentId: selectedAssignment.id,
          content: submissionContent.trim(),
        });
        showToast("Work submitted successfully!", "success");
      }

      setIsSubmitModalOpen(false);
      fetchAssignmentsAndSubmissions();
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.[0]?.error ||
        "Failed to submit coursework";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter items based on statusFilter
  const filteredAssignments = assignments.filter((a) => {
    const sub = submissionMap.get(a.id);
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return !sub;
    if (statusFilter === "submitted") return sub && sub.status !== "Graded";
    if (statusFilter === "graded") return sub && sub.status === "Graded";
    return true;
  });

  const columns = [
    {
      header: "Assignment Details",
      accessor: (a: Assignment) => (
        <div className="space-y-1 py-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {a.title}
            </span>
            <Badge variant="neutral">{a.subjectName}</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-md">
            {a.description || "No instructions provided."}
          </p>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Teacher: <strong>{a.teacherName}</strong></span>
            <span>•</span>
            <span>Max Score: <strong className="text-slate-700 dark:text-slate-300">{a.maxMarks} pts</strong></span>
          </div>
        </div>
      ),
    },
    {
      header: "Deadline",
      accessor: (a: Assignment) => {
        const deadlineDate = new Date(a.deadline);
        const isOverdue = deadlineDate < new Date();

        return (
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{deadlineDate.toLocaleDateString()}</span>
            </div>
            <div className="text-[11px]">
              {isOverdue ? (
                <span className="text-rose-500 font-semibold flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Closed</span>
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {deadlineDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Submission Status",
      accessor: (a: Assignment) => {
        const sub = submissionMap.get(a.id);
        if (!sub) {
          const isOverdue = new Date(a.deadline) < new Date();
          return isOverdue ? (
            <Badge variant="error">Missing / Closed</Badge>
          ) : (
            <Badge variant="warning">Not Submitted</Badge>
          );
        }

        if (sub.status === "Graded") {
          return (
            <div className="space-y-1">
              <Badge variant="success">Graded</Badge>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {sub.marks} / {sub.maxMarks} pts
              </div>
            </div>
          );
        }

        if (sub.status === "Late") {
          return <Badge variant="error">Late Submission</Badge>;
        }

        return <Badge variant="info">Submitted</Badge>;
      },
    },
    {
      header: "Actions",
      accessor: (a: Assignment) => {
        const sub = submissionMap.get(a.id);
        const isOverdue = new Date(a.deadline) < new Date();

        if (sub && sub.status === "Graded") {
          return (
            <Button
              size="sm"
              variant="outline"
              id={`view-grade-btn-${a.id}`}
              onClick={() => handleOpenGradeModal(a, sub)}
              className="cursor-pointer text-xs"
            >
              <Award className="w-3.5 h-3.5 mr-1 text-emerald-600" /> View Grade
            </Button>
          );
        }

        if (sub) {
          return (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                id={`update-submission-btn-${a.id}`}
                onClick={() => handleOpenSubmitModal(a, sub)}
                disabled={!a.allowResubmission || isOverdue}
                className="cursor-pointer text-xs"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> {a.allowResubmission && !isOverdue ? "Edit Work" : "View Work"}
              </Button>
            </div>
          );
        }

        return (
          <Button
            size="sm"
            variant="primary"
            id={`submit-work-btn-${a.id}`}
            onClick={() => handleOpenSubmitModal(a, null)}
            disabled={isOverdue}
            className="cursor-pointer text-xs"
          >
            <Send className="w-3.5 h-3.5 mr-1" /> Submit Work
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Class Coursework & Tasks</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View active assignments for your classroom, submit answers, and track deadlines
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <Input
            id="search-tasks-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by assignment title..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Select
            id="filter-task-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="all">All Assignments</option>
            <option value="pending">Pending Submission</option>
            <option value="submitted">Submitted (Awaiting Grade)</option>
            <option value="graded">Graded</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredAssignments}
        loading={loading}
        page={page}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={FileSpreadsheet}
            title="No Class Tasks Available"
            description="Your teachers have not published any assignments for your class yet."
          />
        }
      />

      {/* Submit / Edit Work Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={existingSubmission ? "Edit Coursework Submission" : "Submit Coursework"}
        subtitle={
          selectedAssignment
            ? `${selectedAssignment.title} • ${selectedAssignment.subjectName}`
            : "Submit your assignment answer"
        }
      >
        {selectedAssignment && (
          <form onSubmit={handleSubmitWork} className="space-y-5 pt-2">
            {/* Task Info Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">Instructor: <strong className="text-slate-800 dark:text-slate-200">{selectedAssignment.teacherName}</strong></span>
                <span className="text-slate-500">Max Score: <strong className="text-indigo-600 dark:text-indigo-400">{selectedAssignment.maxMarks} Points</strong></span>
                <span className="text-slate-500">Due: <strong className="text-slate-800 dark:text-slate-200">{new Date(selectedAssignment.deadline).toLocaleString()}</strong></span>
              </div>

              {selectedAssignment.description && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/40">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Instructions & Problem Prompt:
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedAssignment.description}
                  </p>
                </div>
              )}
            </div>

            {/* Answer Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your Answer / Submission Work *
              </label>
              <textarea
                id="submission-content-input"
                rows={6}
                required
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Type or paste your complete solution, essay response, code snippets, or repository links..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Markdown & plain text supported</span>
                <span>{submissionContent.length} characters</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={submitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                id="submit-assignment-btn"
                loading={submitting}
                className="cursor-pointer"
              >
                <Send className="w-4 h-4 mr-1.5" />
                {existingSubmission ? "Save Updated Work" : "Turn In Work"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Grade & Feedback Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title="Graded Submission Details"
        subtitle={
          selectedAssignment
            ? `${selectedAssignment.title} • ${selectedAssignment.subjectName}`
            : "Review your score and feedback"
        }
      >
        {selectedAssignment && existingSubmission && (
          <div className="space-y-5 pt-2">
            {/* Score Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Awarded Score
                </p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {existingSubmission.marks}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    / {existingSubmission.maxMarks} pts
                  </span>
                </div>
              </div>

              <div className="text-right">
                <Badge variant="success">Graded</Badge>
                <p className="text-[11px] text-slate-400 mt-1">
                  Score: {Math.round(((existingSubmission.marks || 0) / existingSubmission.maxMarks) * 100)}%
                </p>
              </div>
            </div>

            {/* Teacher Feedback Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Teacher Feedback & Guidance
              </label>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic">
                {existingSubmission.feedback ? `"${existingSubmission.feedback}"` : "No written feedback was provided."}
              </div>
            </div>

            {/* Your Submitted Work */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your Submitted Answer
              </label>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                {existingSubmission.content}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setIsGradeModalOpen(false)}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function StudentAssignmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 animate-pulse">Loading class tasks...</div>}>
      <StudentAssignmentsContent />
    </Suspense>
  );
}
