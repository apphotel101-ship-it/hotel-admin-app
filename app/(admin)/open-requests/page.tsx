"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/auth/api";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { useAuth } from "@/context/auth-context";
import { acknowledgeOrder, searchOrdersByStatus } from "@/lib/orders/api";
import { formatOrderItemsTitle } from "@/lib/orders/format-order-items";
import type { OrderRow } from "@/lib/orders/types";

function formatRelativeTime(iso: string): string {
  try {
    const createdAt = new Date(iso).getTime();
    const diffMins = Math.max(1, Math.floor((Date.now() - createdAt) / 60000));
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hr ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day ago`;
  } catch {
    return "";
  }
}

export default function OpenRequestsPage() {
  const { request } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await searchOrdersByStatus(request, ["PLACED"]);
      setOrders(res.orders);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load open requests.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAcknowledge(orderId: number) {
    setBusyId(orderId);
    setError(null);
    try {
      await acknowledgeOrder(request, orderId);
      setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not acknowledge this request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Open guest requests</h3>
            <p>New orders awaiting acknowledgement · {orders.length} open</p>
          </div>
        </div>
        {error ? <div className="inline-alert">{error}</div> : null}
        {loading ? (
          <div className="panel-pad muted">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="empty-requests">Relax there are no open requests</div>
        ) : (
          <div className="requests-list">
            {orders.map((row) => (
              <div key={row.order_id} className="req-row req-row-card">
                <div className="req-dot" />
                <div className="req-body">
                  <div className="req-title">{formatOrderItemsTitle(row)}</div>
                  <div className="req-meta">
                    Room {row.room_number} · {row.guest_name} · {row.service}
                    {formatRelativeTime(row.created_at) ? ` · ${formatRelativeTime(row.created_at)}` : ""}
                  </div>
                </div>
                <div className="req-actions">
                  <OrderStatusBadge status={row.status} />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busyId === row.order_id}
                    onClick={() => void onAcknowledge(row.order_id)}
                  >
                    {busyId === row.order_id ? "Please wait…" : "Acknowledge"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
