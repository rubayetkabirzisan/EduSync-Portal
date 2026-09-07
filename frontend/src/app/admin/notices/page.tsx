"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Notice, CreateNoticeRequest } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast-context";
import { BellRing, Trash2, Plus, Info, X } from "lucide-react";

async function getAllNotices() {
  const response = await api.get<Notice[]>("/notices/all");
  return response.data;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const [newNotice, setNewNotice] = useState<CreateNoticeRequest>({
    title: "",
    content: "",
    audience: 0,
  });

  useEffect(() => {
    let cancelled = false;

    getAllNotices()
      .then((data) => {
        if (!cancelled) setNotices(data);
      })
      .catch((err) => {
        console.error("Failed to load notices:", err);
        addToast("Failed to load notices", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [addToast]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setNotices(await getAllNotices());
    } catch (err) {
      console.error("Failed to load notices:", err);
      addToast("Failed to load notices", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/notices", newNotice);
      addToast("Notice published successfully!", "success");
      setIsModalOpen(false);
      setNewNotice({ title: "", content: "", audience: 0 });
      await fetchNotices();
    } catch (err) {
      console.error(err);
      addToast("Failed to publish notice", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      addToast("Notice deleted", "success");
      fetchNotices();
    } catch (err) {
      console.error(err);
      addToast("Failed to delete notice", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Notice Board Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Publish system-wide announcements to all students and teachers.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Publish Notice
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Info className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p>No notices found.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className="p-6 rounded-2xl border transition-all relative bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            >
              <button
                onClick={() => handleDelete(notice.id)}
                className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                title="Delete Notice"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="mb-4 pr-8 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {notice.title}
                  </h3>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Published on {new Date(notice.createdAt).toLocaleString()} by {notice.createdByName}
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {notice.content}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create Notice</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  required
                  type="text"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="E.g., Mid-Term Exam Schedule"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Write the announcement details here..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Publish Notice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
