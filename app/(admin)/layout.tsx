"use client";

import type { ReactNode } from "react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
