"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Notice, PagedResponse } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { BellRing, Calendar, Megaphone, User, Info } from "lucide-react";

interface NoticesBoardProps {
  subtitle?: string;
}

export function NoticesBoard({ subtitle = "Important updates from the administration." }: NoticesBoardProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get<PagedResponse<Notice>>("/notices?pageSize=50");
      setNotices(res.data.items || []);
    } catch (err) {
      console.error("Failed to load notices:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <BellRing className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Notices & Announcements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Info className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p>No announcements at this time.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className={`p-6 rounded-2xl border transition-all ${
                notice.isPriority
                  ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md"
              }`}
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {notice.isPriority && (
                      <Badge variant="error" className="animate-pulse">
                        <Megaphone className="w-3 h-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {notice.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {notice.authorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(notice.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {notice.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
