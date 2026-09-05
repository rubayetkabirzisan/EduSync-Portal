"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, Minimize2, Maximize2 } from "lucide-react";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Hello! I'm your EduSync AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      // Typically we'd call our backend proxy or Django directly here.
      // For Phase 6 we will implement the actual integration. 
      // For Phase 7 UI, we provide the UI and mocked delay to simulate it.
      
      const API_URL = "http://127.0.0.1:5080/api/Chatbot/chat";
      // This fetch is purely speculative, Phase 6 will finalize the implementation
      // We will try to fetch, if it fails we mock a response for now
      let botResponse = "";
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
          },
          body: JSON.stringify({ message: userMessage }),
        });
        
        if (response.ok) {
          const data = await response.json();
          botResponse = data.reply || data.response || "I received your message.";
        } else {
          throw new Error("Backend returned an error");
        }
      } catch (e) {
        throw e;
      }
      
      setMessages(prev => [...prev, { role: "bot", text: botResponse }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "bot", text: "Sorry, I'm having trouble connecting to my brain right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 hover:shadow-indigo-600/50 transition-all z-50 group flex items-center justify-center"
      >
        <MessageSquare className="w-6 h-6" />
        <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div className={`fixed right-6 z-50 transition-all duration-300 ease-in-out ${
      isMinimized 
        ? "bottom-6 w-72 h-14" 
        : "bottom-6 w-[350px] sm:w-[400px] h-[500px] max-h-[calc(100vh-2rem)]"
    }`}>
      <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div 
          className="p-3 bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-between text-white cursor-pointer select-none shrink-0"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1">
                EduSync Assistant <Sparkles className="w-3 h-3 text-amber-300" />
              </h3>
              <p className="text-[10px] text-indigo-100 font-medium">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button 
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" 
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" 
                      : "bg-violet-600 text-white"
                  }`}>
                    {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm shadow-xs"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-violet-600 text-white">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full pl-4 pr-12 py-2.5 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl outline-none text-sm text-slate-900 dark:text-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white transition-colors cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
