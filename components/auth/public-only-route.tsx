"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace("/open-requests");
    }
  }, [isAuthenticated, isInitializing, router]);

  if (isInitializing) {
    return <div className="auth-screen-loader">Checking your session...</div>;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
