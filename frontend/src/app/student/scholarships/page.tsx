"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Scholarship, ScholarshipApplication } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast-context";
import { Banknote, Plus, X, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";

async function getStudentScholarshipData() {
  const [scholarshipsResponse, applicationsResponse] = await Promise.all([
    api.get<Scholarship[]>("/scholarships"),
    api.get<ScholarshipApplication[]>("/scholarships/my-applications"),
  ]);

  return {
    scholarships: scholarshipsResponse.data,
    applications: applicationsResponse.data,
  };
}

export default function StudentScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [myApplications, setMyApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState("");
  const [reason, setReason] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    getStudentScholarshipData()
      .then((data) => {
        if (cancelled) return;
        setScholarships(data.scholarships);
        setMyApplications(data.applications);
      })
      .catch((err) => {
        console.error("Failed to load scholarships:", err);
        addToast("Failed to load scholarship data", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [addToast]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getStudentScholarshipData();
      setScholarships(data.scholarships);
      setMyApplications(data.applications);
    } catch (err) {
      console.error("Failed to load scholarships:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScholarshipId) {
      addToast("Please select a scholarship program", "error");
      return;
    }

    try {
      await api.post("/scholarships/apply", {
        scholarshipId: selectedScholarshipId,
        reason,
      });
      addToast("Scholarship application submitted!", "success");
      setIsModalOpen(false);
      setReason("");
      setSelectedScholarshipId("");
      await fetchData();
    } catch (err) {
      console.error(err);
      addToast("Failed to submit scholarship application", "error");
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
              Scholarships & Financial Aid
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Apply for financial support programs offered by the institution.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 cursor-pointer bg-lime-600 hover:bg-lime-700 text-white border-none">
          <Plus className="w-4 h-4" /> New Application
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Scholarships */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-5 h-5 text-lime-500" /> Available Programs
          </h2>
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading programs...</div>
          ) : scholarships.length === 0 ? (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-500">
              No scholarships are currently available.
            </div>
          ) : (
            scholarships.map((s) => (
              <div key={s.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-lime-500/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">{s.name}</h3>
                  <Badge variant="success" className="font-bold text-sm bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/40 dark:text-lime-300 dark:border-lime-800/50">
                    ${s.amount.toLocaleString()}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{s.description}</p>
                <div className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Deadline: {new Date(s.deadline).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* My Applications */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> My Applications
          </h2>
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading applications...</div>
          ) : myApplications.length === 0 ? (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center text-slate-500">
              You haven&apos;t applied for any scholarships yet.
            </div>
          ) : (
            myApplications.map((app) => (
              <div key={app.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex justify-between items-center mb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Applied for:</p>
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                      {app.scholarshipName || "Unknown Program"}
                    </h3>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
                <div className="text-xs text-slate-500 mb-2 font-medium">
                  Submitted: {new Date(app.createdAt).toLocaleDateString()}
                </div>
                {app.adminFeedback && (
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700">
                    <span className="font-bold block mb-1">Remarks:</span>
                    {app.adminFeedback}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Apply for Scholarship</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleApply} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Program
                </label>
                <select
                  required
                  value={selectedScholarshipId}
                  onChange={(e) => setSelectedScholarshipId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Select a scholarship --</option>
                  {scholarships.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (${s.amount})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Statement of Need / Reason
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none"
                  placeholder="Explain why you are applying for this scholarship..."
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-lime-600 hover:bg-lime-700 text-white border-none">
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
