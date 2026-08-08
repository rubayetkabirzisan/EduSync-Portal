"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Submission, PagedResponse } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { FileCheck, GraduationCap, Calendar, Award } from "lucide-react";

export default function AdminSubmissionsPage() {
  const { error } = useToast();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<PagedResponse<Submission>>(
        `/admin/submissions?page=${page}&pageSize=10`
      );
      setSubmissions(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch {
      error("Failed to load submissions overview.");
    } finally {
      setIsLoading(false);
    }
  }, [page, error]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Graded":
        return <Badge variant="success">Graded</Badge>;
      case "Submitted":
        return <Badge variant="info">Submitted</Badge>;
      case "Late":
        return <Badge variant="danger">Late Submission</Badge>;
      case "UnderReview":
        return <Badge variant="warning">Under Review</Badge>;
      case "NeedsRevision":
        return <Badge variant="purple">Needs Revision</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: Column<Submission>[] = [
    {
      header: "Assignment & Student",
      accessor: (s) => (
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{s.assignmentTitle}</p>
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{s.studentName}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Submission Content",
      accessor: (s) => (
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-xs">
          {s.content}
        </p>
      ),
    },
    {
      header: "Status",
      accessor: (s) => getStatusBadge(s.status),
    },
    {
      header: "Score / Grade",
      accessor: (s) => (
        <div className="flex items-center space-x-1.5">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {s.marks !== null && s.marks !== undefined ? `${s.marks} / ${s.maxMarks}` : `— / ${s.maxMarks}`}
          </span>
        </div>
      ),
    },
    {
      header: "Turned In At",
      accessor: (s) => (
        <div className="flex items-center space-x-1 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {new Date(s.submittedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          System Submissions
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Complete audit trail of all student coursework submissions and teacher evaluation scores
        </p>
      </div>

      <Table
        columns={columns}
        data={submissions}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        emptyMessage="No student submissions recorded yet."
        pagination={{
          page,
          pageSize: 10,
          totalCount,
          totalPages,
          onPageChange: (p) => setPage(p),
        }}
      />
    </div>
  );
}
