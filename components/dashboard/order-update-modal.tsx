"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/auth/api";
import type { AuthFetchOptions } from "@/lib/auth/api";
import { getOrderById, updateOrderFromModal } from "@/lib/orders/api";
import type { OrderDetail } from "@/lib/orders/types";

const UPDATE_STATUSES = ["IN_PROGRESS", "READY", "DELIVERED", "RESOLVED", "CANCELLED"] as const;

type AuthenticatedFetch = <T>(path: string, init?: AuthFetchOptions) => Promise<T>;

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function statusInOptions(status: string): boolean {
  const u = status.toUpperCase();
  return UPDATE_STATUSES.some((s) => s === u);
}

type Props = {
  orderId: number | null;
  onClose: () => void;
  onUpdated: () => void;
  request: AuthenticatedFetch;
};

export function OrderUpdateModal({ orderId, onClose, onUpdated, request }: Props) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("IN_PROGRESS");
  const [comment, setComment] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (orderId == null) {
      return;
    }

    let cancelled = false;
    setDetail(null);
    setLoadError(null);
    setSubmitError(null);
    setComment("");
    setLoading(true);

    void getOrderById(request, orderId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        const raw = String(data.status ?? "").toUpperCase();
        setSelectedStatus(statusInOptions(raw) ? raw : "IN_PROGRESS");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof ApiError ? e.message : "Could not load order details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, request]);

  useEffect(() => {
    if (orderId == null) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [orderId, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (orderId == null) {
      return;
    }

    setSubmitError(null);
    setSaving(true);
    try {
      await updateOrderFromModal(request, orderId, {
        status: selectedStatus,
        comment: comment.trim(),
      });
      onUpdated();
      onClose();
    } catch (e: unknown) {
      setSubmitError(e instanceof ApiError ? e.message : "Could not update this order.");
    } finally {
      setSaving(false);
    }
  }

  if (orderId == null) {
    return null;
  }

  return (
    <div className="order-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="order-modal-header">
          <h3 id="order-modal-title">Update order #{orderId}</h3>
          <button type="button" className="order-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="order-modal-body">
          {loading ? (
            <p className="modal-muted">Loading order…</p>
          ) : loadError ? (
            <p className="modal-error">{loadError}</p>
          ) : detail ? (
            <>
              <dl className="order-detail-grid">
                <dt>Order ID</dt>
                <dd>{detail.order_id}</dd>
                <dt>Service</dt>
                <dd>{detail.service}</dd>
                <dt>Current status</dt>
                <dd>{detail.status.replace(/_/g, " ")}</dd>
                <dt>Instructions</dt>
                <dd>{detail.instructions?.trim() ? detail.instructions : "—"}</dd>
                <dt>Total amount</dt>
                <dd>{formatMoney(detail.total_amount)}</dd>
                <dt>Billable</dt>
                <dd>{detail.is_billable ? "Yes" : "No"}</dd>
              </dl>

              {detail.items?.length ? (
                <div className="order-modal-items">
                  <h4 className="order-modal-items-title">Items</h4>
                  <ul className="order-item-list">
                    {detail.items.map((line, index) => (
                      <li key={`${line.name_snapshot}-${index}`} className="order-item-row">
                        <div className="order-item-thumb">
                          {line.image_snapshot ? (
                            <img
                              src={line.image_snapshot}
                              alt=""
                              width={48}
                              height={48}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="order-item-placeholder" aria-hidden>
                              ·
                            </span>
                          )}
                        </div>
                        <div className="order-item-info">
                          <div className="order-item-name">{line.name_snapshot}</div>
                          <div className="order-item-meta">
                            {formatMoney(line.price_snapshot)} each · Qty {line.quantity} · Line{" "}
                            {formatMoney(line.price_snapshot * line.quantity)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="modal-muted">No line items.</p>
              )}

              <form className="order-update-form" onSubmit={handleSubmit}>
                <label className="form-group">
                  <span className="form-label">New status</span>
                  <select
                    className="form-input"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    required
                  >
                    {UPDATE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-group">
                  <span className="form-label">Comment</span>
                  <textarea
                    className="form-input modal-textarea"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Add a note for this update…"
                  />
                </label>
                {submitError ? <div className="modal-error-inline">{submitError}</div> : null}
                <div className="order-modal-actions">
                  <button type="button" className="btn" onClick={onClose} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving || !detail}>
                    {saving ? "Saving…" : "Submit"}
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
