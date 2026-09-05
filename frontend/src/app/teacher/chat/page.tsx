"use client";
import React from "react";
import { ChatUI } from "@/components/chat/ChatUI";

export default function TeacherChatPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
        Faculty & Student Lounge
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Real-time communications with the entire university community.
      </p>
      <ChatUI />
    </div>
  );
}
