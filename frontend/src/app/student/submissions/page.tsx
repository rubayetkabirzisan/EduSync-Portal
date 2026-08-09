"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Submission, PagedResponse } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/Card";
import {
  Award,
  Clock,
  CheckCircle2,
  FileCheck,
  Calendar,
  Eye,
  MessageSquare,
  FileText,
} from "lucide-react";

export default function StudentSubmissionsPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [page, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      let query = `/student/submissions?page=${page}&pageSize=10`;
      if (statusFilter !== "all") query += `&status=${statusFilter}`;

      const res = await api.get<PagedResponse<Submission>>(query);
      setSubmissions(res.data.items || []);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error("Failed to load submissions history:", err);
      showToast("Failed to load submission history", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetailModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Graded":
        return <Badge variant="success">Graded</Badge>;
      case "Late":
        return <Badge variant="error">Late</Badge>;
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
      header: "Assignment",
      accessor: (s: Submission) => (
        <div className="space-y-1 py-1">
          <p className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-sm">
            {s.assignmentTitle}
          </p>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Turned in: {new Date(s.submittedAt).toLocaleDateString()} at {new Date(s.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (s: Submission) => getStatusBadge(s.status),
    },
    {
      header: "Score Awarded",
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
              <span>Pending Evaluation</span>
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
            <span className="text-xs text-slate-400">No feedback yet</span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (s: Submission) => (
        <Button
          size="sm"
          variant="outline"
          id={`view-submission-btn-${s.id}`}
          onClick={() => handleOpenDetailModal(s)}
          className="cursor-pointer text-xs"
        >
          <Eye className="w-3.5 h-3.5 mr-1" /> View Details
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
            <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>My Submission History & Grade Reports</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track all your turned-in assignments, teacher grades, and feedback reports
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Select
            id="filter-submission-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-56"
          >
            <option value="all">All Submissions</option>
            <option value="Graded">Graded Only</option>
            <option value="Submitted">Submitted (Pending)</option>
            <option value="Late">Late Submissions</option>
          </Select>
        </div>
      </div>

      {/* Table */}
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
            title="No Submissions History"
            description="You have not submitted any coursework assignments yet."
          />
        }
      />

      {/* Submission Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submission & Grade Details"
        subtitle={selectedSubmission?.assignmentTitle || "Coursework submission"}
      >
        {selectedSubmission && (
          <div className="space-y-5 pt-2">
            {/* Score Box if graded */}
            {selectedSubmission.marks !== null && selectedSubmission.marks !== undefined ? (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Awarded Grade
                  </p>
                  <div className="flex items-baseline space-x-1 mt-1">
                    <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {selectedSubmission.marks}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      / {selectedSubmission.maxMarks} pts
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="success">Graded</Badge>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Score: {Math.round((selectedSubmission.marks / selectedSubmission.maxMarks) * 100)}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center space-x-3 text-xs text-amber-700 dark:text-amber-300">
                <Clock className="w-5 h-5 shrink-0" />
                <span>
                  This assignment has been received and is currently waiting for teacher evaluation.
                </span>
              </div>
            )}

            {/* Teacher Feedback Box if graded */}
            {selectedSubmission.feedback && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  <span>Teacher's Feedback</span>
                </label>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic">
                  "{selectedSubmission.feedback}"
                </div>
              </div>
            )}

            {/* Submitted Answer Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Your Submitted Answer</span>
              </label>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed shadow-inner">
                {selectedSubmission.content}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
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
