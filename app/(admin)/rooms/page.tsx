"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/auth/api";
import { useAuth } from "@/context/auth-context";
import { fetchAdminRooms } from "@/lib/rooms/api";
import { groupRoomsByFloorAndType, sectionTitle } from "@/lib/rooms/group-rooms";
import type { AdminRoom } from "@/lib/rooms/types";

function normalizeStatusVariant(status: string): "occupied" | "available" | "reserved" | "other" {
  const u = status.trim().toLowerCase();
  if (u === "occupied" || u.includes("occupied")) return "occupied";
  if (u === "available" || u.includes("available")) return "available";
  if (u === "reserved" || u.includes("reserved")) return "reserved";
  return "other";
}

function roomTypeBadgeClass(roomType: string): string {
  const l = roomType.toLowerCase();
  if (l.includes("deluxe") || l.includes("suite")) return "room-type-badge room-type-badge--deluxe";
  if (l.includes("standard")) return "room-type-badge room-type-badge--standard";
  return "room-type-badge room-type-badge--default";
}

function guestInitialsPlaceholder(): string {
  return "G";
}

export default function RoomsPage() {
  const { request } = useAuth();
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminRooms(request);
      setRooms(res.rooms ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load rooms.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    let occupied = 0;
    let available = 0;
    let reserved = 0;
    for (const r of rooms) {
      const v = normalizeStatusVariant(r.status);
      if (v === "occupied") occupied += 1;
      else if (v === "available") available += 1;
      else if (v === "reserved") reserved += 1;
    }
    return { occupied, available, reserved };
  }, [rooms]);

  const groups = useMemo(() => groupRoomsByFloorAndType(rooms), [rooms]);

  return (
    <div className="room-mgmt">
      <div className="room-mgmt-toolbar">
        <div>
          <div className="room-legend" aria-hidden>
            <span className="room-legend-item">
              <span className="room-legend-swatch room-legend-swatch--occupied" /> Occupied
            </span>
            <span className="room-legend-item">
              <span className="room-legend-swatch room-legend-swatch--available" /> Available
            </span>
            <span className="room-legend-item">
              <span className="room-legend-swatch room-legend-swatch--reserved" /> Reserved
            </span>
          </div>
        </div>
        <div className="room-summary-badges">
          <span className="room-summary-pill room-summary-pill--occupied">{counts.occupied} Occupied</span>
          <span className="room-summary-pill room-summary-pill--available">{counts.available} Available</span>
          <span className="room-summary-pill room-summary-pill--reserved">{counts.reserved} Reserved</span>
        </div>
      </div>

      {error ? <div className="inline-alert room-mgmt-alert">{error}</div> : null}

      {loading ? (
        <div className="panel-pad muted">Loading rooms…</div>
      ) : rooms.length === 0 ? (
        <div className="empty-requests">No rooms to display.</div>
      ) : (
        <div className="room-mgmt-sections">
          {groups.map((g) => (
            <section key={`${g.floor}-${g.roomType}`} className="room-section-card">
              <div className="room-section-head">
                <span className={roomTypeBadgeClass(g.roomType)}>{g.roomType}</span>
                <h2 className="room-section-title">{sectionTitle(g.floor, g.roomType)}</h2>
                <span className="room-section-count">{g.rooms.length} rooms</span>
              </div>
              <div className="room-card-grid">
                {g.rooms.map((room) => {
                  const variant = normalizeStatusVariant(room.status);
                  const headerClass =
                    variant === "other"
                      ? "room-card-header room-card-header--other"
                      : `room-card-header room-card-header--${variant}`;
                  const isAvailable = variant === "available";
                  const isReserved = variant === "reserved";

                  return (
                    <article key={room.id} className="room-card">
                      <div className={headerClass}>
                        <div className="room-card-type-caps">{room.roomType.toUpperCase()}</div>
                        <div className="room-card-number">{room.roomNumber}</div>
                        <div className="room-card-status-pill">
                          <span className="room-card-dot" /> {room.status}
                        </div>
                      </div>
                      <div className="room-card-body">
                        {isAvailable ? (
                          <p className="room-card-available-msg">Ready for check-in</p>
                        ) : (
                          <div className="room-card-guest">
                            <div className="room-card-guest-left">
                              <div className="room-card-avatar" aria-hidden>
                                {guestInitialsPlaceholder()}
                              </div>
                              <div className="room-card-guest-text">
                                <div className="room-card-guest-name">Guest</div>
                                <div className="room-card-guest-label">{isReserved ? "Incoming" : "Guest"}</div>
                              </div>
                            </div>
                            <div className="room-card-dates">
                              <div className="room-card-date-block">
                                <span className="room-card-date-label">In</span>
                                <span className="room-card-date-val">—</span>
                              </div>
                              <div className="room-card-date-block">
                                <span className="room-card-date-label">Out</span>
                                <span className="room-card-date-val">—</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
