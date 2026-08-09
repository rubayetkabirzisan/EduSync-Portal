"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Submission, Assignment, PagedResponse } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/Card";
import {
  FileCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  MessageSquare,
  FileText,
  User,
  ExternalLink,
} from "lucide-react";

function TeacherSubmissionsContent() {
  const searchParams = useSearchParams();
  const initialGradeId = searchParams.get("gradeId");
  const initialAssignmentId = searchParams.get("assignmentId");

  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(initialAssignmentId || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");

  // Grading Modal State
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [marks, setMarks] = useState<number | "">("");
  const [feedback, setFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);

  useEffect(() => {
    fetchAssignmentsList();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [page, selectedAssignmentId, statusFilter, studentSearch]);

  const fetchAssignmentsList = async () => {
    try {
      const res = await api.get<PagedResponse<Assignment>>("/assignments?pageSize=100");
      setAssignments(res.data.items || []);
    } catch (err) {
      console.error("Failed to load assignments list:", err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      let query = `/assignments/submissions?page=${page}&pageSize=10`;
      if (selectedAssignmentId !== "all") query += `&assignmentId=${selectedAssignmentId}`;
      if (statusFilter !== "all") query += `&status=${statusFilter}`;
      if (studentSearch) query += `&search=${encodeURIComponent(studentSearch)}`;

      const res = await api.get<PagedResponse<Submission>>(query);
      const items = res.data.items || [];
      setSubmissions(items);
      setTotalCount(res.data.totalCount || 0);

      // Auto-open grading modal if gradeId query param matches
      if (initialGradeId && !selectedSubmission) {
        const found = items.find((s) => s.id === initialGradeId);
        if (found) {
          handleOpenGradingModal(found);
        }
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
      showToast("Failed to load student submissions", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGradingModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setMarks(submission.marks !== undefined && submission.marks !== null ? submission.marks : "");
    setFeedback(submission.feedback || "");
    setIsGradingModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    if (marks === "" || isNaN(Number(marks))) {
      showToast("Please enter a valid numeric score", "warning");
      return;
    }

    const numericMarks = Number(marks);
    if (numericMarks < 0 || numericMarks > selectedSubmission.maxMarks) {
      showToast(`Score must be between 0 and ${selectedSubmission.maxMarks}`, "warning");
      return;
    }

    try {
      setSubmittingGrade(true);
      await api.post(`/assignments/submissions/${selectedSubmission.id}/grade`, {
        marks: numericMarks,
        feedback: feedback.trim(),
      });

      showToast("Submission graded successfully!", "success");
      setIsGradingModalOpen(false);
      fetchSubmissions();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to submit grade";
      showToast(msg, "error");
    } finally {
      setSubmittingGrade(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Graded":
        return <Badge variant="success">Graded</Badge>;
      case "Late":
        return <Badge variant="error">Late Submission</Badge>;
      case "NeedsRevision":
        return <Badge variant="warning">Needs Revision</Badge>;
      case "UnderReview":
        return <Badge variant="info">Under Review</Badge>;
      case "Submitted":
      default:
        return <Badge variant="info">Submitted</Badge>;
    }
  };

  const columns = [
    {
      header: "Student",
      accessor: (s: Submission) => (
        <div className="flex items-center space-x-3 py-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {s.studentName ? s.studentName.charAt(0).toUpperCase() : "S"}
          </div>
          <div>
            <p className="font-bold text-xs text-slate-900 dark:text-white">
              {s.studentName || "Anonymous Student"}
            </p>
            <p className="text-[11px] text-slate-400 truncate max-w-xs">
              ID: {s.studentId.slice(0, 8)}...
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Assignment",
      accessor: (s: Submission) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-xs">
            {s.assignmentTitle}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Submitted: {new Date(s.submittedAt).toLocaleDateString()} at{" "}
            {new Date(s.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (s: Submission) => getStatusBadge(s.status),
    },
    {
      header: "Grade / Score",
      accessor: (s: Submission) => (
        <div>
          {s.marks !== null && s.marks !== undefined ? (
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                {s.marks} / {s.maxMarks} pts
              </span>
              <div className="text-[10px] text-slate-400">
                ({Math.round((s.marks / s.maxMarks) * 100)}%)
              </div>
            </div>
          ) : (
            <span className="text-xs text-amber-500 font-medium flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Feedback",
      accessor: (s: Submission) => (
        <div className="max-w-xs">
          {s.feedback ? (
            <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-1">
              "{s.feedback}"
            </p>
          ) : (
            <span className="text-xs text-slate-400">No feedback added</span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (s: Submission) => (
        <Button
          size="sm"
          variant={s.status === "Graded" ? "outline" : "primary"}
          id={`grade-submission-btn-${s.id}`}
          onClick={() => handleOpenGradingModal(s)}
          className="cursor-pointer text-xs"
        >
          {s.status === "Graded" ? "Update Grade" : "Evaluate"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <FileCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Submissions & Grading Hub</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review student responses, award marks, and provide constructive commentary
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Assignment selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Select
            id="filter-assignment-select"
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full sm:w-64"
          >
            <option value="all">All Coursework Tasks</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.className})
              </option>
            ))}
          </Select>

          {/* Status selector */}
          <Select
            id="filter-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted (Pending)</option>
            <option value="Late">Late Submissions</option>
            <option value="Graded">Graded</option>
          </Select>
        </div>
      </div>

      {/* Submissions Table */}
      <DataTable
        columns={columns}
        data={submissions}
        loading={loading}
        page={page}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={FileCheck}
            title="No Submissions Found"
            description="Student submissions for your coursework tasks will appear here for grading and feedback."
          />
        }
      />

      {/* Grading & Feedback Modal */}
      <Modal
        isOpen={isGradingModalOpen}
        onClose={() => setIsGradingModalOpen(false)}
        title="Grade Student Submission"
        subtitle={
          selectedSubmission
            ? `${selectedSubmission.studentName} • ${selectedSubmission.assignmentTitle}`
            : "Evaluate student work"
        }
      >
        {selectedSubmission && (
          <form onSubmit={handleSaveGrade} className="space-y-5 pt-2">
            {/* Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-xs">
              <span className="text-slate-500">Submitted:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {new Date(selectedSubmission.submittedAt).toLocaleString()}
              </strong>
              <span>•</span>
              <span className="text-slate-500">Max Score:</span>
              <strong className="text-indigo-600 dark:text-indigo-400">
                {selectedSubmission.maxMarks} Points
              </strong>
              <span>•</span>
              {getStatusBadge(selectedSubmission.status)}
            </div>

            {/* Student Submitted Answer / Content */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Student's Submitted Work</span>
              </label>
              <div
                id="student-submission-content"
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed shadow-inner"
              >
                {selectedSubmission.content || "No textual answer provided."}
              </div>
            </div>

            {/* Grade Input & Feedback */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="grade-marks-input"
                type="number"
                min="0"
                max={selectedSubmission.maxMarks}
                step="0.5"
                label={`Award Score (0 - ${selectedSubmission.maxMarks}) *`}
                required
                value={marks}
                onChange={(e) => setMarks(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`e.g. ${Math.round(selectedSubmission.maxMarks * 0.85)}`}
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quick Score Presets
                </label>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMarks(selectedSubmission.maxMarks)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarks(Math.round(selectedSubmission.maxMarks * 0.9))}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
                  >
                    90%
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarks(Math.round(selectedSubmission.maxMarks * 0.8))}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                  >
                    80%
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarks(Math.round(selectedSubmission.maxMarks * 0.7))}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                  >
                    70%
                  </button>
                </div>
              </div>
            </div>

            {/* Written Feedback Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span>Instructor Written Feedback & Guidance</span>
              </label>
              <textarea
                id="grade-feedback-input"
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Great effort on the implementation! Consider improving your error handling..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGradingModalOpen(false)}
                disabled={submittingGrade}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                id="save-grade-submit-btn"
                loading={submittingGrade}
                className="cursor-pointer"
              >
                <Award className="w-4 h-4 mr-1.5" /> Save Grade & Feedback
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function TeacherSubmissionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 animate-pulse">Loading grading workspace...</div>}>
      <TeacherSubmissionsContent />
    </Suspense>
  );
}
