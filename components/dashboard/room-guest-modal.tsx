"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/auth/api";
import type { AuthFetchOptions } from "@/lib/auth/api";
import { assignGuestToRoom, checkoutRoomGuest, updateRoomGuest } from "@/lib/rooms/api";
import { guestInitials } from "@/lib/rooms/guest-utils";
import { floorFromRoomNumber } from "@/lib/orders/floor";
import type { AdminRoom, RoomGuestDetails, UpsertRoomGuestPayload } from "@/lib/rooms/types";

type AuthenticatedFetch = <T>(path: string, init?: AuthFetchOptions) => Promise<T>;

type GuestFormState = {
  fullName: string;
  governmentId: string;
  phone: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  specialRequests: string;
};

function emptyForm(): GuestFormState {
  return {
    fullName: "",
    governmentId: "",
    phone: "",
    checkInDate: "",
    checkInTime: "",
    checkOutDate: "",
    checkOutTime: "",
    specialRequests: "",
  };
}

function fromGuestDetails(g: RoomGuestDetails): GuestFormState {
  return {
    fullName: g.guest_name ?? "",
    governmentId: g.government_id ?? "",
    phone: g.phone ?? "",
    checkInDate: (g.check_in ?? "").slice(0, 10),
    checkInTime: toTimeInputValue(g.check_in_time),
    checkOutDate: (g.check_out ?? "").slice(0, 10),
    checkOutTime: toTimeInputValue(g.check_out_time),
    specialRequests: g.special_requests ?? "",
  };
}

function toTimeInputValue(t: string | null | undefined): string {
  if (!t?.trim()) return "";
  const m = t.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const h = Math.min(23, parseInt(m[1], 10));
  const min = Math.min(59, parseInt(m[2], 10));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatDisplayDate(isoDate: string): string {
  const d = isoDate.trim();
  if (!d) return "—";
  const parsed = new Date(d.length <= 10 ? `${d}T12:00:00` : d);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatDisplayTime(hhmm: string): string {
  if (!hhmm.trim()) return "—";
  const [hs, ms] = hhmm.split(":");
  const h = parseInt(hs, 10);
  const m = parseInt(ms ?? "0", 10);
  if (!Number.isFinite(h)) return "—";
  const dt = new Date();
  dt.setHours(h, m || 0, 0, 0);
  return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function normalizeStatusVariant(status: string): "occupied" | "available" | "reserved" | "other" {
  const u = status.trim().toLowerCase();
  if (u === "occupied" || u.includes("occupied")) return "occupied";
  if (u === "available" || u.includes("available")) return "available";
  if (u === "reserved" || u.includes("reserved")) return "reserved";
  return "other";
}

function roomTypeLine(roomType: string): string {
  const t = roomType.trim();
  const lower = t.toLowerCase();
  if (lower.includes("suite")) return t;
  return `${t} room`;
}

function guestIdLabel(room: AdminRoom, details: RoomGuestDetails | null): string {
  if (details) {
    return `Guest ID: GSTD-${details.guest_id}`;
  }
  return `Room ${room.roomNumber}`;
}

function buildPayload(form: GuestFormState): UpsertRoomGuestPayload {
  return {
    guest_name: form.fullName.trim(),
    government_id: form.governmentId.trim() || null,
    phone: form.phone.trim() || null,
    check_in: form.checkInDate.trim(),
    check_out: form.checkOutDate.trim(),
    check_in_time: form.checkInTime.trim() || null,
    check_out_time: form.checkOutTime.trim() || null,
    special_requests: form.specialRequests.trim() || null,
  };
}

type Props = {
  room: AdminRoom | null;
  onClose: () => void;
  onSuccess: () => void;
  request: AuthenticatedFetch;
};

export function RoomGuestModal({ room, onClose, onSuccess, request }: Props) {
  const [form, setForm] = useState<GuestFormState>(emptyForm);
  const [baseline, setBaseline] = useState<GuestFormState>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const variant = room ? normalizeStatusVariant(room.status) : "other";
  const isCheckInMode = Boolean(room && !room.guestDetails);

  const resetFromRoom = useCallback(
    (r: AdminRoom) => {
      if (r.guestDetails) {
        const next = fromGuestDetails(r.guestDetails);
        setForm(next);
        setBaseline(next);
      } else {
        const empty = emptyForm();
        setForm(empty);
        setBaseline(empty);
      }
      setEditing(false);
      setActionError(null);
    },
    [],
  );

  useEffect(() => {
    if (!room) return;
    resetFromRoom(room);
  }, [room, resetFromRoom]);

  useEffect(() => {
    if (!room) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [room, onClose]);

  const floor = room ? floorFromRoomNumber(room.roomNumber) ?? 1 : 1;
  const headerTone =
    variant === "available"
      ? "room-guest-modal-header room-guest-modal-header--available"
      : variant === "reserved"
        ? "room-guest-modal-header room-guest-modal-header--reserved"
        : variant === "occupied"
          ? "room-guest-modal-header room-guest-modal-header--occupied"
          : "room-guest-modal-header room-guest-modal-header--other";

  const showFieldsEditable = isCheckInMode || editing;
  const displayName = form.fullName.trim() || (isCheckInMode ? "Guest details" : "—");
  const initials = guestInitials(form.fullName.trim() || "Guest");

  const handleSave = async () => {
    if (!room) return;
    setActionError(null);
    const payload = buildPayload(form);
    if (!payload.guest_name) {
      setActionError("Full name is required.");
      return;
    }
    if (!payload.check_in || !payload.check_out) {
      setActionError("Check-in and check-out dates are required.");
      return;
    }
    setSaving(true);
    try {
      if (isCheckInMode) {
        await assignGuestToRoom(request, room.id, payload);
      } else {
        await updateRoomGuest(request, room.id, payload);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Could not save guest details.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm(baseline);
    setEditing(false);
    setActionError(null);
  };

  const handleCheckout = async () => {
    if (!room?.guestDetails) return;
    if (!window.confirm("Check out this guest and free the room?")) return;
    setActionError(null);
    setCheckoutLoading(true);
    try {
      await checkoutRoomGuest(request, room.id, room.guestDetails.guest_id);
      onSuccess();
      onClose();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Could not check out guest.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const readOnlyBlock = !showFieldsEditable ? (
    <div className="room-guest-modal-readonly-grid">
      <div className="room-guest-modal-readonly-field room-guest-modal-readonly-field--full">
        <span className="room-guest-modal-readonly-label">Full name</span>
        <span className="room-guest-modal-readonly-val">{form.fullName.trim() || "—"}</span>
      </div>
      <div className="room-guest-modal-readonly-field">
        <span className="room-guest-modal-readonly-label">Government ID</span>
        <span className="room-guest-modal-readonly-val">{form.governmentId.trim() || "—"}</span>
      </div>
      <div className="room-guest-modal-readonly-field">
        <span className="room-guest-modal-readonly-label">Phone</span>
        <span className="room-guest-modal-readonly-val">{form.phone.trim() || "—"}</span>
      </div>
      <div className="room-guest-modal-readonly-field">
        <span className="room-guest-modal-readonly-label">Check-in date</span>
        <span className="room-guest-modal-readonly-val">{formatDisplayDate(form.checkInDate)}</span>
      </div>
      <div className="room-guest-modal-readonly-field">
        <span className="room-guest-modal-readonly-label">Check-in time</span>
        <span className="room-guest-modal-readonly-val">{formatDisplayTime(form.checkInTime)}</span>
      </div>
      <div className="room-guest-modal-readonly-field">
        <span className="room-guest-modal-readonly-label">Check-out date</span>
        <span className="room-guest-modal-readonly-val">{formatDisplayDate(form.checkOutDate)}</span>
      </div>
      <div className="room-guest-modal-readonly-field">
        <span className="room-guest-modal-readonly-label">Check-out time</span>
        <span className="room-guest-modal-readonly-val">{formatDisplayTime(form.checkOutTime)}</span>
      </div>
      <div className="room-guest-modal-readonly-field room-guest-modal-readonly-field--full">
        <span className="room-guest-modal-readonly-label">Special requests</span>
        <span className="room-guest-modal-readonly-val">{form.specialRequests.trim() || "—"}</span>
      </div>
    </div>
  ) : null;

  const editFieldsBlock = showFieldsEditable ? (
    <div className="room-guest-modal-form-grid">
      <label className="room-guest-modal-field room-guest-modal-field--full">
        <span className="room-guest-modal-field-label">Full name</span>
        <input
          className="room-guest-modal-input"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          autoComplete="name"
        />
      </label>
      <label className="room-guest-modal-field">
        <span className="room-guest-modal-field-label">Government ID</span>
        <input
          className="room-guest-modal-input"
          value={form.governmentId}
          onChange={(e) => setForm((f) => ({ ...f, governmentId: e.target.value }))}
          autoComplete="off"
        />
      </label>
      <label className="room-guest-modal-field">
        <span className="room-guest-modal-field-label">Phone</span>
        <input
          className="room-guest-modal-input"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          autoComplete="tel"
        />
      </label>
      <label className="room-guest-modal-field">
        <span className="room-guest-modal-field-label">Check-in date</span>
        <input
          className="room-guest-modal-input room-guest-modal-input--date"
          type="date"
          value={form.checkInDate}
          onChange={(e) => setForm((f) => ({ ...f, checkInDate: e.target.value }))}
        />
      </label>
      <label className="room-guest-modal-field">
        <span className="room-guest-modal-field-label">Check-in time</span>
        <input
          className="room-guest-modal-input room-guest-modal-input--time"
          type="time"
          value={form.checkInTime}
          onChange={(e) => setForm((f) => ({ ...f, checkInTime: e.target.value }))}
        />
      </label>
      <label className="room-guest-modal-field">
        <span className="room-guest-modal-field-label">Check-out date</span>
        <input
          className="room-guest-modal-input room-guest-modal-input--date"
          type="date"
          value={form.checkOutDate}
          onChange={(e) => setForm((f) => ({ ...f, checkOutDate: e.target.value }))}
        />
      </label>
      <label className="room-guest-modal-field">
        <span className="room-guest-modal-field-label">Check-out time</span>
        <input
          className="room-guest-modal-input room-guest-modal-input--time"
          type="time"
          value={form.checkOutTime}
          onChange={(e) => setForm((f) => ({ ...f, checkOutTime: e.target.value }))}
        />
      </label>
      <label className="room-guest-modal-field room-guest-modal-field--full">
        <span className="room-guest-modal-field-label">Special requests</span>
        <textarea
          className="room-guest-modal-input room-guest-modal-textarea"
          rows={2}
          value={form.specialRequests}
          onChange={(e) => setForm((f) => ({ ...f, specialRequests: e.target.value }))}
        />
      </label>
    </div>
  ) : null;

  if (!room) {
    return null;
  }

  return (
    <div className="room-guest-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="room-guest-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-guest-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={headerTone}>
          <div className="room-guest-modal-header-main">
            <div className="room-guest-modal-header-text">
              <div className="room-guest-modal-floor-line">
                Floor {floor} · {room.roomType.toUpperCase()}
              </div>
              <h2 id="room-guest-modal-title" className="room-guest-modal-room-num">
                {room.roomNumber}
              </h2>
              <p className="room-guest-modal-room-sub">{roomTypeLine(room.roomType)}</p>
            </div>
            <div className="room-guest-modal-header-actions">
              {!isCheckInMode ? (
                <button
                  type="button"
                  className={
                    editing
                      ? "room-guest-modal-btn-edit room-guest-modal-btn-edit--active"
                      : "room-guest-modal-btn-edit"
                  }
                  onClick={() => {
                    setActionError(null);
                    setEditing(true);
                  }}
                  disabled={editing}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                    />
                  </svg>
                  {editing ? "Editing" : "Edit"}
                </button>
              ) : null}
              <button type="button" className="room-guest-modal-btn-close" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>
          </div>
          <div className="room-guest-modal-header-row2">
            <div className="room-guest-modal-status-pill" aria-hidden>
              <span className="room-guest-modal-status-dot" />
              {room.status}
              <span className="room-guest-modal-status-chev">▾</span>
            </div>
          </div>
        </div>

        <div className="room-guest-modal-body">
          {editing && !isCheckInMode ? (
            <div className="room-guest-modal-banner" role="status">
              <span className="room-guest-modal-banner-icon" aria-hidden>
                ⓘ
              </span>
              Edit mode — modify fields below and click Save changes
            </div>
          ) : null}

          <div className="room-guest-modal-profile">
            <div className="room-guest-modal-avatar" aria-hidden>
              {initials}
            </div>
            <div>
              <div className="room-guest-modal-profile-name">{displayName}</div>
              <div className="room-guest-modal-profile-id">{guestIdLabel(room, room.guestDetails)}</div>
            </div>
          </div>

          {readOnlyBlock}
          {editFieldsBlock}

          {actionError ? <div className="room-guest-modal-error">{actionError}</div> : null}

          <div className="room-guest-modal-footer">
            {isCheckInMode ? (
              <div className="room-guest-modal-footer-row room-guest-modal-footer-row--end">
                <button type="button" className="room-guest-modal-btn-secondary" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="room-guest-modal-btn-primary-dark" onClick={handleSave} disabled={saving}>
                  {saving ? "Submitting…" : "Submit"}
                </button>
              </div>
            ) : editing ? (
              <div className="room-guest-modal-footer-row room-guest-modal-footer-row--split">
                <button
                  type="button"
                  className="room-guest-modal-btn-checkout"
                  onClick={handleCheckout}
                  disabled={saving || checkoutLoading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M10.09 15.59 11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
                    />
                  </svg>
                  Check out guest
                </button>
                <div className="room-guest-modal-footer-actions-right">
                  <button
                    type="button"
                    className="room-guest-modal-btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="room-guest-modal-btn-primary-dark"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="room-guest-modal-btn-checkout room-guest-modal-btn-checkout--full"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M10.09 15.59 11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
                  />
                </svg>
                Check out guest
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
