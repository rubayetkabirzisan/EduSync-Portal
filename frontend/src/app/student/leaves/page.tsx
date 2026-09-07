"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { LeaveApplication, CreateLeaveRequest } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast-context";
import { CalendarDays, Pencil, Plus, Info, X, Clock, CheckCircle2, XCircle } from "lucide-react";

async function getStudentLeaves() {
  const response = await api.get<LeaveApplication[]>("/leaves/my-leaves");
  return response.data;
}

export default function StudentLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const [newLeave, setNewLeave] = useState<CreateLeaveRequest>({
    reason: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    let cancelled = false;

    getStudentLeaves()
      .then((data) => {
        if (!cancelled) setLeaves(data);
      })
      .catch((err) => {
        console.error("Failed to load leaves:", err);
        addToast("Failed to load leave applications", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [addToast]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setLeaves(await getStudentLeaves());
    } catch (err) {
      console.error("Failed to load leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setEditingLeave(null);
    setNewLeave({ reason: "", startDate: today, endDate: today });
    setIsModalOpen(true);
  };

  const openEditModal = (leave: LeaveApplication) => {
    setEditingLeave(leave);
    setNewLeave({
      reason: leave.reason,
      startDate: leave.startDate.slice(0, 10),
      endDate: leave.endDate.slice(0, 10),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingLeave(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        reason: newLeave.reason,
        startDate: new Date(newLeave.startDate).toISOString(),
        endDate: new Date(newLeave.endDate).toISOString(),
      };

      if (editingLeave) {
        await api.put(`/leaves/${editingLeave.id}`, payload);
        addToast("Leave application updated!", "success");
      } else {
        await api.post("/leaves", payload);
        addToast("Leave application submitted!", "success");
      }

      setIsModalOpen(false);
      setEditingLeave(null);
      setNewLeave({ reason: "", startDate: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] });
      await fetchLeaves();
    } catch (err) {
      console.error(err);
      addToast(editingLeave ? "Failed to update leave application" : "Failed to submit leave application", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              My Leave Applications
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Apply for leaves and track your application status.
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2 cursor-pointer bg-pink-600 hover:bg-pink-700 text-white border-none">
          <Plus className="w-4 h-4" /> Apply for Leave
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Info className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p>You haven&apos;t submitted any leave applications yet.</p>
          </div>
        ) : (
          leaves.map((leave) => {
            const isApproved = leave.status === "Approved";
            const isRejected = leave.status === "Rejected";
            const isPending = leave.status === "Pending";

            return (
              <div
                key={leave.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Applied on {new Date(leave.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(leave)}
                        className="cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                    )}
                    <Badge
                      variant={isApproved ? "success" : isRejected ? "error" : "warning"}
                      className="flex items-center gap-1"
                    >
                      {isApproved && <CheckCircle2 className="w-3 h-3" />}
                      {isRejected && <XCircle className="w-3 h-3" />}
                      {isPending && <Clock className="w-3 h-3" />}
                      {leave.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-3">
                  <span className="font-semibold block mb-1 text-slate-900 dark:text-slate-200">Reason:</span>
                  {leave.reason}
                </div>
                {leave.adminFeedback && (
                  <div className={`text-sm p-4 rounded-xl border ${
                    isApproved 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300" 
                      : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50 text-rose-700 dark:text-rose-300"
                  }`}>
                    <span className="font-bold block mb-1">Admin Remarks:</span>
                    {leave.adminFeedback}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingLeave ? "Edit Leave Application" : "Apply for Leave"}
              </h3>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    required
                    type="date"
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    required
                  type="date"
                  value={newLeave.endDate}
                  min={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={4}
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Please state your reason for taking leave..."
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="bg-pink-600 hover:bg-pink-700 text-white border-none">
                  {editingLeave ? "Save Changes" : "Submit Application"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
