"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Exam } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { CalendarDays, Calendar as CalendarIcon, Clock, BookOpen, Info, AlertCircle } from "lucide-react";

export default function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchExams() {
    try {
      setLoading(true);
      const res = await api.get<Exam[]>("/exams");
      // The backend StudentController / ExamsController (if modified for students) should only return their exams
      // Or we filter here just in case (assuming the API does the heavy lifting).
      setExams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load exams:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchExams(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const getStatus = (startTime: string, durationMinutes: number) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const now = new Date();

    if (now < start) return { label: "Upcoming", variant: "info" as const };
    if (now > end) return { label: "Completed", variant: "neutral" as const };
    return { label: "In Progress", variant: "success" as const };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            My Exams Schedule
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View upcoming examinations, times, and locations.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300 flex gap-3 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>Please arrive at your designated examination room at least 15 minutes before the scheduled start time. Late arrivals may not be permitted to enter.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="text-slate-400 p-8 text-center md:col-span-2 xl:col-span-3">Loading schedule...</div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 md:col-span-2 xl:col-span-3 flex flex-col items-center">
            <Info className="w-8 h-8 mb-2 text-slate-400" />
            No upcoming exams scheduled.
          </div>
        ) : (
          exams.map(exam => {
            const date = new Date(exam.startTime);
            const status = getStatus(exam.startTime, exam.durationMinutes);
            
            return (
              <div key={exam.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-bl-lg">
                  <Badge variant={status.variant} className="border-none">{status.label}</Badge>
                </div>
                
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3 pr-20 leading-tight">
                  {exam.title}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CalendarIcon className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">{date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-slate-400">•</span>
                    <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="info" className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {exam.subjectName}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.durationMinutes} mins</span>
                      <span className="flex items-center gap-1">Max Marks: {exam.maxMarks}</span>
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md text-sm shadow-xs">
                      {exam.roomName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
