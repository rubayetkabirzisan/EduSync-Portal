"use client";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["Student", "Admin"]}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
