"use client";
import React from "react";
import { ChatUI } from "@/components/chat/ChatUI";

export default function StudentChatPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
        Global Discussions
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Connect with teachers, admins, and fellow students across the university.
      </p>
      <ChatUI />
    </div>
  );
}
