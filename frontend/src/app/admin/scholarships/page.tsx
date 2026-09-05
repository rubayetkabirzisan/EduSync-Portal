"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Scholarship, ScholarshipApplication, CreateScholarshipRequest, UpdateScholarshipApplicationRequest } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast-context";
import { Banknote, Plus, X, FileText, Check, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function AdminScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ScholarshipApplication | null>(null);
  
  // Forms
  const [newProgram, setNewProgram] = useState<CreateScholarshipRequest>({
    name: "",
    description: "",
    amount: 1000,
    deadline: new Date().toISOString().split("T")[0],
  });
  const [feedback, setFeedback] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scholRes, appRes] = await Promise.all([
        api.get<Scholarship[]>("/scholarships"),
        api.get<ScholarshipApplication[]>("/scholarships/applications"),
      ]);
      setScholarships(scholRes.data || []);
      setApplications(appRes.data || []);
    } catch (err) {
      console.error("Failed to load scholarships data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/scholarships", {
        ...newProgram,
        deadline: new Date(newProgram.deadline).toISOString()
      });
      addToast("Scholarship program created!", "success");
      setIsProgramModalOpen(false);
      setNewProgram({ name: "", description: "", amount: 1000, deadline: new Date().toISOString().split("T")[0] });
      fetchData();
    } catch (err) {
      console.error(err);
      addToast("Failed to create scholarship program", "error");
    }
  };

  const handleUpdateStatus = async (status: "UnderReview" | "Approved" | "Rejected" | "Disbursed") => {
    if (!selectedApp) return;
    try {
      const payload: UpdateScholarshipApplicationRequest = {
        status,
        adminFeedback: feedback,
      };
      await api.put(`/scholarships/applications/${selectedApp.id}`, payload);
      addToast(`Application status updated to ${status}!`, "success");
      setSelectedApp(null);
      setFeedback("");
      fetchData();
    } catch (err) {
      console.error(err);
      addToast("Failed to update status", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
      case "Disbursed":
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {status}</Badge>;
      case "Rejected":
        return <Badge variant="error" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> {status}</Badge>;
      case "UnderReview":
        return <Badge variant="info" className="flex items-center gap-1"><FileText className="w-3 h-3" /> {status}</Badge>;
      default:
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-lime-50 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Scholarships Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create financial aid programs and review student applications.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsProgramModalOpen(true)} className="gap-2 cursor-pointer bg-lime-600 hover:bg-lime-700 text-white border-none">
          <Plus className="w-4 h-4" /> New Program
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Available Scholarships */}
        <div className="xl:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            Active Programs
          </h2>
          {loading ? (
            <div className="text-sm text-slate-400">Loading programs...</div>
          ) : scholarships.length === 0 ? (
            <div className="text-sm text-slate-500 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
              No active scholarship programs.
            </div>
          ) : (
            <div className="space-y-3">
              {scholarships.map(s => (
                <div key={s.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{s.name}</h3>
                    <Badge variant="success" className="font-bold text-xs bg-lime-100 text-lime-800 shrink-0 border-lime-200 dark:bg-lime-900/40 dark:text-lime-300 dark:border-lime-800/50">
                      ${s.amount.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Deadline: {new Date(s.deadline).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications List */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            Student Applications
          </h2>
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No applications have been submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <div key={app.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white">{app.studentName}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Program: <span className="text-indigo-600 dark:text-indigo-400">{app.scholarshipName}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Reason:</span> {app.reason}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setFeedback(app.adminFeedback || "");
                      }}
                      className="cursor-pointer"
                    >
                      Review Application
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Program Modal */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">New Scholarship Program</h3>
              <button onClick={() => setIsProgramModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProgram} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Program Name
                </label>
                <input
                  required
                  type="text"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none"
                  placeholder="E.g., Merit Scholarship 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount ($)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={newProgram.amount}
                  onChange={(e) => setNewProgram({ ...newProgram, amount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deadline Date
                </label>
                <input
                  required
                  type="date"
                  value={newProgram.deadline}
                  onChange={(e) => setNewProgram({ ...newProgram, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none"
                  placeholder="Details and eligibility..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsProgramModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-lime-600 hover:bg-lime-700 text-white border-none">
                  Create Program
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review App Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Review Scholarship Application</h3>
              <button onClick={() => setSelectedApp(null)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Student</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedApp.studentName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Program</p>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{selectedApp.scholarshipName}</p>
                </div>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Applicant's Statement</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{selectedApp.reason}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Remarks
                </label>
                <textarea
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Feedback or processing notes..."
                />
              </div>
              
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                <Button 
                  type="button" 
                  onClick={() => handleUpdateStatus("UnderReview")}
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border-none w-full text-xs"
                >
                  Mark Review
                </Button>
                <Button 
                  type="button" 
                  onClick={() => handleUpdateStatus("Rejected")}
                  className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border-none w-full text-xs"
                >
                  Reject
                </Button>
                <Button 
                  type="button" 
                  onClick={() => handleUpdateStatus("Approved")}
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-none w-full text-xs"
                >
                  Approve
                </Button>
                <Button 
                  type="button" 
                  onClick={() => handleUpdateStatus("Disbursed")}
                  className="bg-lime-600 text-white hover:bg-lime-700 border-none w-full text-xs"
                >
                  Disburse
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
