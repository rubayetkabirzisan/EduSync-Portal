"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { AttendanceRecord, PagedResponse } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Clock, CheckCircle2, XCircle, AlertCircle, Info, Calendar as CalendarIcon } from "lucide-react";

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      // Backend automatically filters by the authenticated student
      const res = await api.get<PagedResponse<AttendanceRecord>>("/attendance/student");
      // Sort by date descending
      const sorted = (res.data.items || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(sorted);
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Present":
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Present</Badge>;
      case "Absent":
        return <Badge variant="error" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Absent</Badge>;
      case "Late":
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Late</Badge>;
      case "Excused":
        return <Badge variant="info" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Excused</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const totalClasses = records.length;
  const presentCount = records.filter(r => r.status === "Present" || r.status === "Late").length;
  const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            My Attendance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track your class presence and absences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Overall Attendance</p>
          <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
            {percentage}%
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Classes</p>
          <div className="text-4xl font-black text-slate-800 dark:text-slate-100">
            {totalClasses}
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Classes Attended</p>
          <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
            {presentCount}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            Recent Records
          </h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
              Loading attendance...
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Info className="w-6 h-6 mx-auto text-slate-400" />
              <p className="text-sm text-slate-500">No attendance records found yet.</p>
            </div>
          ) : (
            records.map(record => (
              <div key={record.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">
                      {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Class: <span className="text-indigo-600 dark:text-indigo-400">{record.className}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Recorded by: {record.recordedByTeacherName}</p>
                  </div>
                </div>
                <div>
                  {getStatusBadge(record.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
