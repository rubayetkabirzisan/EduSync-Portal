"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Exam, CreateExamRequest, PagedResponse } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast-context";
import { CalendarDays, Plus, X, Calendar as CalendarIcon, Clock, Users, BookOpen } from "lucide-react";

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExam, setNewExam] = useState<CreateExamRequest>({
    title: "",
    classId: "",
    subjectId: "",
    startTime: new Date().toISOString().slice(0, 16),
    durationMinutes: 120,
    maxMarks: 100,
    roomName: "Room 101"
  });
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, clsRes, subRes] = await Promise.all([
        api.get<PagedResponse<Exam>>("/exams?pageSize=100"),
        api.get<PagedResponse<{id:string; name:string}>>("/admin/classes?pageSize=100"),
        api.get<PagedResponse<{id:string; name:string}>>("/admin/subjects?pageSize=100")
      ]);
      setExams(examsRes.data.items || []);
      setClasses(clsRes.data.items || []);
      setSubjects(subRes.data.items || []);
    } catch (err) {
      console.error("Failed to load exams data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/exams", {
        ...newExam,
        startTime: new Date(newExam.startTime).toISOString()
      });
      addToast("Exam scheduled successfully!", "success");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      addToast(err.response?.data?.message || err.response?.data || "Failed to schedule exam. Possible conflict.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Exam Scheduler
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Schedule exams with automatic conflict detection.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 cursor-pointer bg-orange-600 hover:bg-orange-700 text-white border-none">
          <Plus className="w-4 h-4" /> Schedule Exam
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="text-slate-400 p-8 text-center md:col-span-2 xl:col-span-3">Loading schedule...</div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 md:col-span-2 xl:col-span-3">
            No exams scheduled.
          </div>
        ) : (
          exams.map(exam => {
            const date = new Date(exam.startTime);
            const isUpcoming = date > new Date();
            
            return (
              <div key={exam.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow relative overflow-hidden">
                {!isUpcoming && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-bl-lg">
                    Completed
                  </div>
                )}
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3 pr-16 leading-tight">
                  {exam.title}
                </h3>
                
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CalendarIcon className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">{date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-slate-400">•</span>
                    <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="neutral" className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800">
                      <Users className="w-3 h-3" /> {exam.className}
                    </Badge>
                    <Badge variant="info" className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {exam.subjectName}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.durationMinutes} mins</span>
                    <span className="flex items-center gap-1">Max: {exam.maxMarks}</span>
                    <span className="flex items-center gap-1 ml-auto text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                      {exam.roomName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Schedule New Exam</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exam Title
                </label>
                <input
                  required
                  type="text"
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. Mid-Term Examination 2025"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class
                  </label>
                  <select
                    required
                    value={newExam.classId}
                    onChange={(e) => setNewExam({ ...newExam, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="" disabled>Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    required
                    value={newExam.subjectId}
                    onChange={(e) => setNewExam({ ...newExam, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="" disabled>Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={newExam.startTime}
                    onChange={(e) => setNewExam({ ...newExam, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Location
                  </label>
                  <input
                    required
                    type="text"
                    value={newExam.roomName}
                    onChange={(e) => setNewExam({ ...newExam, roomName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g. Hall A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    required
                    type="number"
                    min="15"
                    value={newExam.durationMinutes}
                    onChange={(e) => setNewExam({ ...newExam, durationMinutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Marks
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={newExam.maxMarks}
                    onChange={(e) => setNewExam({ ...newExam, maxMarks: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white border-none">
                  Save to Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
