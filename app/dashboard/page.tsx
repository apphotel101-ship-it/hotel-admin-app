"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { admin, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="dashboard-wrapper">
        <header className="dashboard-header">
          <div>
            <h1>Welcome, {admin?.email}</h1>
            <p>
              Role: <strong>{admin?.role}</strong>
            </p>
          </div>
          <button type="button" className="logout-button" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </header>

        <section className="dashboard-frame">
          <iframe src="/admin_dashboard.html" title="Admin Dashboard" />
        </section>
      </main>
    </ProtectedRoute>
  );
}
