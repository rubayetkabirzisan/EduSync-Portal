"use client";

import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import api from "@/lib/api";
import { ChatMessage, PagedResponse } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { Send, MessageSquare, Loader2, Users, Shield, GraduationCap, BookOpen } from "lucide-react";
import { Badge } from "../ui/Badge";

export function ChatUI() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Initial fetch and SignalR connection
  useEffect(() => {
    fetchMessages();

    if (token) {
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl("http://127.0.0.1:5080/hubs/chat", {
          accessTokenFactory: () => token,
          // Since it's local development, avoid cross-origin negotiation issues by forcing WebSockets
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .build();

      newConnection.on("ReceiveMessage", (message: ChatMessage) => {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      });

      newConnection.start()
        .then(() => console.log("Connected to SignalR Community Chat"))
        .catch(err => console.error("SignalR Connection Error: ", err));

      setConnection(newConnection);

      return () => {
        if (newConnection) {
          newConnection.stop();
        }
      };
    }
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get<PagedResponse<ChatMessage>>("/CommunityChat?pageSize=50");
      // The API returns most recent first, we need chronological for chat
      const chronological = (res.data.items || []).reverse();
      setMessages(chronological);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    try {
      setSending(true);
      const messageContent = input.trim();
      setInput(""); // optimistic clear
      
      // Sending via API endpoint (which then broadcasts via SignalR)
      await api.post("/CommunityChat/send", { content: messageContent });
    } catch (err) {
      console.error("Failed to send message", err);
      // Restore input if failed
      setInput(input);
    } finally {
      setSending(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin": return <Shield className="w-3 h-3" />;
      case "Teacher": return <BookOpen className="w-3 h-3" />;
      default: return <GraduationCap className="w-3 h-3" />;
    }
  };
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "Teacher": return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
      default: return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white leading-tight">Community Chat</h2>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
          </div>
        </div>
        <Badge variant="neutral" className="flex items-center gap-1">
          <Users className="w-3 h-3" /> University Global
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm font-medium">Loading history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">Be the first to send a message!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?.id;
            const showHeader = index === 0 || messages[index - 1].senderId !== msg.senderId;

            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2`}>
                <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                  
                  {showHeader && !isMe && (
                    <div className="flex items-center gap-2 mb-1.5 ml-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {msg.senderName}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${getRoleColor(msg.senderRole)}`}>
                        {getRoleIcon(msg.senderRole)} {msg.senderRole}
                      </span>
                    </div>
                  )}

                  <div className={`px-4 py-2.5 shadow-sm text-sm ${
                    isMe 
                      ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl rounded-bl-sm border border-slate-200/50 dark:border-slate-700/50"
                  }`}>
                    {msg.content}
                  </div>
                  
                  <div className={`text-[10px] font-medium text-slate-400 mt-1 ${isMe ? "mr-1" : "ml-1"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full pl-5 pr-14 py-3.5 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none text-sm text-slate-900 dark:text-white transition-all shadow-inner dark:shadow-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="absolute right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
