"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Sparkles, Shield, BookOpen, GraduationCap, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await login(email, password);
      toastSuccess("Successfully logged in!");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || "Invalid credentials. Please try again.";
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      {/* Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/30 mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            EduSync <span className="text-indigo-400">Portal</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Role-based Assignment, Submission & Grading Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Sign In</h2>
            <p className="text-xs text-slate-400">
              Enter your credentials to access your portal
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/50 text-xs text-rose-200 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                id="email-input"
                label="Email Address"
                type="email"
                placeholder="name@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-8" />
            </div>

            <div className="relative">
              <Input
                id="password-input"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-8" />
            </div>

            <Button
              id="login-submit-btn"
              type="submit"
              isLoading={isLoading}
              className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
            >
              Sign In to Account
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
              Quick-Fill Demo Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="demo-admin-btn"
                onClick={() => handleQuickFill("admin@school.test", "Passw0rd!")}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 transition-all cursor-pointer group"
              >
                <Shield className="w-4 h-4 mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">Admin</span>
              </button>

              <button
                type="button"
                id="demo-teacher-btn"
                onClick={() => handleQuickFill("teacher1@school.test", "Passw0rd!")}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-sky-500/30 bg-sky-950/20 hover:bg-sky-900/40 text-sky-300 transition-all cursor-pointer group"
              >
                <BookOpen className="w-4 h-4 mb-1 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">Teacher</span>
              </button>

              <button
                type="button"
                id="demo-student-btn"
                onClick={() => handleQuickFill("student@school.test", "Passw0rd!")}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-300 transition-all cursor-pointer group"
              >
                <GraduationCap className="w-4 h-4 mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">Student</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500">
          Assignment & Submission Management System • Next.js & .NET 10
        </p>
      </div>
    </div>
  );
}
