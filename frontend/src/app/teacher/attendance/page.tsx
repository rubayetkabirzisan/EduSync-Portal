"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { TeachingAssignment, PagedResponse, MarkAttendanceRequest } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast-context";
import { Clock, CheckCircle2, XCircle, AlertCircle, Check, Users, Save } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
}

export default function TeacherAttendancePage() {
  const [allotments, setAllotments] = useState<TeachingAssignment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchAllotments();
  }, []);

  const fetchAllotments = async () => {
    try {
      setLoading(true);
      const res = await api.get<TeachingAssignment[]>("/assignments/my-allotments");
      setAllotments(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedClassId(res.data[0].classId);
      }
    } catch (err) {
      console.error("Failed to load allotments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    }
  }, [selectedClassId]);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const res = await api.get<PagedResponse<Student>>(`/admin/users?role=Student&pageSize=500`);
      // Optionally filter by classId if backend user has classId, otherwise just mock it by showing all fetched students for this demo
      setStudents(res.data.items || []);
      
      // Initialize state to "Present" by default
      const defaultState: Record<string, string> = {};
      (res.data.items || []).forEach(s => {
        defaultState[s.id] = "Present";
      });
      setAttendanceState(defaultState);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      addToast("Failed to fetch students list", "error");
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !date) return;
    
    try {
      setSaving(true);
      const promises = students.map(student => {
        const payload: MarkAttendanceRequest = {
          studentId: student.id,
          classId: selectedClassId,
          date: new Date(date).toISOString(),
          status: attendanceState[student.id] as any
        };
        return api.post("/Attendance", payload);
      });
      
      await Promise.all(promises);
      addToast("Attendance records saved successfully!", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to save some attendance records", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Mark Attendance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Record student attendance for your classes.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-4 md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Select Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <option>Loading classes...</option>
            ) : allotments.length === 0 ? (
              <option value="">No classes assigned</option>
            ) : (
              // Deduplicate classes
              Array.from(new Map(allotments.map(a => [a.classId, a])).values()).map(a => (
                <option key={a.classId} value={a.classId}>{a.className}</option>
              ))
            )}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Student List
          </h2>
          <Button 
            onClick={handleSaveAttendance} 
            disabled={studentsLoading || students.length === 0 || saving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {studentsLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No students found for this selection.
            </div>
          ) : (
            students.map(student => (
              <div key={student.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">{student.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(student.id, "Present")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      attendanceState[student.id] === "Present"
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Present
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange(student.id, "Late")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      attendanceState[student.id] === "Late"
                        ? "bg-amber-500 text-white"
                        : "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Late
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange(student.id, "Excused")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      attendanceState[student.id] === "Excused"
                        ? "bg-sky-500 text-white"
                        : "bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Excused
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange(student.id, "Absent")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      attendanceState[student.id] === "Absent"
                        ? "bg-rose-500 text-white"
                        : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Absent
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
