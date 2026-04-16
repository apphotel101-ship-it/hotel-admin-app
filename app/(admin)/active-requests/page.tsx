"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/auth/api";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { OrderUpdateModal } from "@/components/dashboard/order-update-modal";
import { useAuth } from "@/context/auth-context";
import { searchOrdersByStatus } from "@/lib/orders/api";
import { floorFromRoomNumber } from "@/lib/orders/floor";
import { formatOrderItemsTitle } from "@/lib/orders/format-order-items";
import type { OrderRow } from "@/lib/orders/types";

const ACTIVE_STATUSES = ["IN_PROGRESS", "READY", "ACKNOWLEDGED"] as const;

export default function ActiveRequestsPage() {
  const { request } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floorFilter, setFloorFilter] = useState<string>("");
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [modalOrderId, setModalOrderId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await searchOrdersByStatus(request, [...ACTIVE_STATUSES]);
      setOrders(res.orders);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load active requests.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  const floorOptions = useMemo(() => {
    const floors = new Set<number>();
    for (const o of orders) {
      const f = floorFromRoomNumber(o.room_number);
      if (f != null) floors.add(f);
    }
    return [...floors].sort((a, b) => a - b);
  }, [orders]);

  const roomOptions = useMemo(() => {
    const rooms = new Set<string>();
    for (const o of orders) {
      rooms.add(o.room_number);
    }
    return [...rooms].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (floorFilter) {
        const f = floorFromRoomNumber(o.room_number);
        if (f == null || String(f) !== floorFilter) {
          return false;
        }
      }
      if (roomFilter && o.room_number !== roomFilter) {
        return false;
      }
      if (statusFilter && String(o.status).toUpperCase() !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [orders, floorFilter, roomFilter, statusFilter]);

  return (
    <div>
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Active guest requests</h3>
            <p>In progress, ready, or acknowledged · {filtered.length} shown</p>
          </div>
          <div className="filters-row">
            <label className="filter-field">
              <select
                className="form-input"
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                aria-label="Filter by floor"
              >
                <option value="">All floors</option>
                {floorOptions.map((f) => (
                  <option key={f} value={String(f)}>
                    Floor {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <select
                className="form-input"
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                aria-label="Filter by room number"
              >
                <option value="">All rooms</option>
                {roomOptions.map((r) => (
                  <option key={r} value={r}>
                    Room {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by order status"
              >
                <option value="">All statuses</option>
                {ACTIVE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {error ? <div className="inline-alert">{error}</div> : null}
        {loading ? (
          <div className="panel-pad muted">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="empty-requests">No active requests right now.</div>
        ) : filtered.length === 0 ? (
          <div className="empty-requests">No requests match the selected filters.</div>
        ) : (
          <div className="requests-list">
            {filtered.map((row) => (
              <div key={row.order_id} className="req-row req-row-card">
                <div className="req-dot" />
                <div className="req-body">
                  <div className="req-title">{formatOrderItemsTitle(row)}</div>
                  <div className="req-meta">
                    Room {row.room_number} · {row.guest_name} · {row.status.toString().replace(/_/g, " ")}
                  </div>
                </div>
                <div className="req-actions">
                  <OrderStatusBadge status={row.status} />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setModalOrderId(row.order_id)}
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <OrderUpdateModal
        orderId={modalOrderId}
        onClose={() => setModalOrderId(null)}
        onUpdated={() => void load()}
        request={request}
      />
    </div>
  );
}
