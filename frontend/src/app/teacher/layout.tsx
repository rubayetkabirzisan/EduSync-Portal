"use client";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["Teacher", "Admin"]}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
