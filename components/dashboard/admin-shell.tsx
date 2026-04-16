"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/auth-context";

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

function IconStaff() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "AD";
}

const subtitleDate = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

function pageMeta(pathname: string | null): { title: string; subtitle: string } {
  if (pathname?.startsWith("/open-requests")) {
    return { title: "Open Requests", subtitle: `${subtitleDate} · The Grand Meridian` };
  }
  if (pathname?.startsWith("/active-requests")) {
    return { title: "Active Requests", subtitle: `${subtitleDate} · The Grand Meridian` };
  }
  if (pathname?.startsWith("/rooms")) {
    return { title: "Room management", subtitle: `${subtitleDate} · The Grand Meridian` };
  }
  return { title: "Dashboard", subtitle: `${subtitleDate} · The Grand Meridian` };
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const meta = useMemo(() => pageMeta(pathname), [pathname]);

  const initials = useMemo(() => (admin?.email ? initialsFromEmail(admin.email) : "AD"), [admin?.email]);

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
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-hotel">Admin Panel</div>
          <div className="brand-title">
            The Grand <em>Meridian</em>
          </div>
        </div>
        <nav>
          <div className="nav-section">
            <div className="nav-label">Overview</div>
            <Link href="/dashboard" className={`nav-item${pathname === "/dashboard" ? " active" : ""}`}>
              <span className="nav-icon">
                <IconDashboard />
              </span>
              Dashboard
            </Link>
          </div>
          <div className="nav-section">
            <div className="nav-label">Operations</div>
            <Link href="/open-requests" className={`nav-item${pathname === "/open-requests" ? " active" : ""}`}>
              <span className="nav-icon">
                <IconClipboard />
              </span>
              Open Requests
            </Link>
            <Link href="/active-requests" className={`nav-item${pathname === "/active-requests" ? " active" : ""}`}>
              <span className="nav-icon">
                <IconClipboard />
              </span>
              Active Requests
            </Link>
            <Link href="/rooms" className={`nav-item${pathname === "/rooms" ? " active" : ""}`}>
              <span className="nav-icon">
                <IconHome />
              </span>
              Room Management
            </Link>
            <div className="nav-item nav-item-muted">
              <span className="nav-icon">
                <IconMenu />
              </span>
              Menu & Inventory
            </div>
          </div>
          <div className="nav-section">
            <div className="nav-label">People</div>
            <div className="nav-item nav-item-muted">
              <span className="nav-icon">
                <IconStaff />
              </span>
              Staff Management
            </div>
            <div className="nav-item nav-item-muted">
              <span className="nav-icon">
                <IconMessage />
              </span>
              Complaints & Feedback
            </div>
          </div>
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-avatar">
            <div className="avatar-circle">{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="avatar-name">{admin?.email ?? "Admin"}</div>
              <div className="avatar-role">{admin?.role ?? "Staff"}</div>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-logout"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <h2>{meta.title}</h2>
            <p>{meta.subtitle}</p>
          </div>
          <div className="topbar-right">
            <div className="tb-search">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="search" placeholder="Search guests, rooms…" readOnly aria-readonly />
            </div>
            <div className="tb-btn" aria-hidden>
              <svg viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className="tb-btn" aria-hidden>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="content admin-content">{children}</div>
      </div>
    </div>
  );
}
