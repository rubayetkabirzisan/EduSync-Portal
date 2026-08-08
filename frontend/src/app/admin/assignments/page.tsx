"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Assignment, PagedResponse } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { FileSpreadsheet, Calendar, UserCheck, Building2, CheckCircle2, Clock } from "lucide-react";

export default function AdminAssignmentsPage() {
  const { error } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<PagedResponse<Assignment>>(
        `/admin/assignments?page=${page}&pageSize=10`
      );
      setAssignments(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch {
      error("Failed to load assignments overview.");
    } finally {
      setIsLoading(false);
    }
  }, [page, error]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const columns: Column<Assignment>[] = [
    {
      header: "Assignment Title",
      accessor: (a) => (
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{a.title}</p>
            <p className="text-xs text-slate-500 line-clamp-1">{a.description || "No description provided."}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Instructor",
      accessor: (a) => (
        <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>{a.teacherName}</span>
        </div>
      ),
    },
    {
      header: "Class & Subject",
      accessor: (a) => (
        <div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span>{a.className}</span>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400">{a.subjectName}</span>
        </div>
      ),
    },
    {
      header: "Deadline",
      accessor: (a) => {
        const isPast = new Date(a.deadline) < new Date();
        return (
          <div className={`flex items-center space-x-1 text-xs ${isPast ? "text-rose-500 font-semibold" : "text-slate-600 dark:text-slate-400"}`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {new Date(a.deadline).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: (a) => (
        <Badge variant={a.status === "Published" ? "success" : "neutral"} className="inline-flex items-center space-x-1">
          {a.status === "Published" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
          <span>{a.status}</span>
        </Badge>
      ),
    },
    {
      header: "Submissions",
      accessor: (a) => (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {a.submissionCount} turned in
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          System Assignments
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Global overview of coursework created by all faculty instructors
        </p>
      </div>

      <Table
        columns={columns}
        data={assignments}
        keyExtractor={(a) => a.id}
        isLoading={isLoading}
        emptyMessage="No assignments found in the system."
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
