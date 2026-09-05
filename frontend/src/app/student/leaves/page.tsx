"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { LeaveApplication, CreateLeaveRequest, PagedResponse } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast-context";
import { CalendarDays, Plus, Info, X, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function StudentLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const [newLeave, setNewLeave] = useState<CreateLeaveRequest>({
    reason: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get<PagedResponse<LeaveApplication>>("/leaves?pageSize=50");
      setLeaves(res.data.items || []);
    } catch (err) {
      console.error("Failed to load leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/leaves", {
        reason: newLeave.reason,
        startDate: new Date(newLeave.startDate).toISOString(),
        endDate: new Date(newLeave.endDate).toISOString(),
      });
      addToast("Leave application submitted!", "success");
      setIsModalOpen(false);
      setNewLeave({ reason: "", startDate: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] });
      fetchLeaves();
    } catch (err) {
      console.error(err);
      addToast("Failed to submit leave application", "error");
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
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 cursor-pointer bg-pink-600 hover:bg-pink-700 text-white border-none">
          <Plus className="w-4 h-4" /> Apply for Leave
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Info className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p>You haven't submitted any leave applications yet.</p>
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
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Apply for Leave</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
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
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white border-none">
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
