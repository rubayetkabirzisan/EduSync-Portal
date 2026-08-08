"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("Admin" | "Teacher" | "Student")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard for their role
        const dest =
          user.role === "Admin"
            ? "/admin"
            : user.role === "Teacher"
            ? "/teacher"
            : "/student";
        router.push(dest);
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
