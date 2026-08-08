"use client";

import React from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
