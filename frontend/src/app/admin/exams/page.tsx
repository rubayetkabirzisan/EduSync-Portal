"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Class, Exam, CreateExamRequest, PagedResponse } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast-context";
import { CalendarDays, Plus, X, Calendar as CalendarIcon, Clock, Users, BookOpen, Pencil } from "lucide-react";

const toLocalDateTimeInput = (value: Date | string = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const createDefaultExam = (): CreateExamRequest => ({
  title: "",
  classId: "",
  subjectId: "",
  startTime: toLocalDateTimeInput(),
  durationMinutes: 120,
  maxMarks: 100,
  roomName: "Room 101"
});

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [newExam, setNewExam] = useState<CreateExamRequest>(createDefaultExam);
  
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [examsRes, clsRes, subRes] = await Promise.all([
        api.get<Exam[]>("/exams"),
        api.get<PagedResponse<Class>>("/admin/classes?pageSize=100"),
        api.get<PagedResponse<{id:string; name:string}>>("/admin/subjects?pageSize=100")
      ]);
      setExams(Array.isArray(examsRes.data) ? examsRes.data : []);
      setClasses(clsRes.data.items || []);
      setSubjects(subRes.data.items || []);
    } catch (err) {
      console.error("Failed to load exams data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingExam(null);
    setNewExam(createDefaultExam());
    setIsModalOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setNewExam({
      title: exam.title,
      classId: exam.classId,
      subjectId: exam.subjectId,
      startTime: toLocalDateTimeInput(exam.startTime),
      durationMinutes: exam.durationMinutes,
      maxMarks: exam.maxMarks,
      roomName: exam.roomName
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newExam.durationMinutes < 15 || newExam.maxMarks < 1) {
        addToast("Enter a duration of at least 15 minutes and at least 1 maximum mark.", "error");
        return;
      }

      const payload = {
        ...newExam,
        startTime: new Date(newExam.startTime).toISOString()
      };

      if (editingExam) {
        await api.put(`/exams/${editingExam.id}`, payload);
        addToast("Exam updated successfully!", "success");
      } else {
        await api.post("/exams", payload);
        addToast("Exam scheduled successfully!", "success");
      }

      closeModal();
      await fetchData();
    } catch (err: unknown) {
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
      const message = typeof responseData === "object" && responseData !== null && "message" in responseData
        ? String(responseData.message)
        : typeof responseData === "string"
          ? responseData
          : editingExam
            ? "Failed to update exam."
            : "Failed to schedule exam. Possible conflict.";
      addToast(message, "error");
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
        <Button onClick={openCreateModal} className="gap-2 cursor-pointer bg-orange-600 hover:bg-orange-700 text-white border-none">
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
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                    {exam.title}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isUpcoming && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-md">
                        Completed
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(exam)}
                      aria-label={`Edit ${exam.title}`}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                  </div>
                </div>
                
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
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingExam ? "Edit Exam" : "Schedule New Exam"}
              </h3>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                      <option key={c.id} value={c.id}>
                        {c.name}{c.section ? ` - ${c.section}` : ""}
                      </option>
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
                    value={newExam.durationMinutes || ""}
                    onChange={(e) => setNewExam({
                      ...newExam,
                      durationMinutes: e.target.value === "" ? 0 : e.target.valueAsNumber
                    })}
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
                    value={newExam.maxMarks || ""}
                    onChange={(e) => setNewExam({
                      ...newExam,
                      maxMarks: e.target.value === "" ? 0 : e.target.valueAsNumber
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white border-none">
                  {editingExam ? "Save Changes" : "Save to Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
