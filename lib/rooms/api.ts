import type { AuthFetchOptions } from "@/lib/auth/api";
import type { AdminRoomsResponse, UpsertRoomGuestPayload } from "./types";

type AuthenticatedFetch = <T>(path: string, init?: AuthFetchOptions) => Promise<T>;

export function fetchAdminRooms(fetcher: AuthenticatedFetch): Promise<AdminRoomsResponse> {
  return fetcher<AdminRoomsResponse>("/api/v1/admin/rooms", {
    method: "GET",
  });
}

/** Update an existing stay / guest record for a room. */
export function updateRoomGuest(
  fetcher: AuthenticatedFetch,
  roomId: number,
  payload: UpsertRoomGuestPayload,
): Promise<unknown> {
  return fetcher(`/api/v1/admin/rooms/${roomId}/guest`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** Check a new guest into an available room (or assign when no guest is on file). */
export function assignGuestToRoom(
  fetcher: AuthenticatedFetch,
  roomId: number,
  payload: UpsertRoomGuestPayload,
): Promise<unknown> {
  return fetcher(`/api/v1/admin/rooms/${roomId}/guest`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function checkoutRoomGuest(fetcher: AuthenticatedFetch, roomId: number, guestId: number): Promise<unknown> {
  return fetcher(`/api/v1/admin/rooms/${roomId}/checkout`, {
    method: "POST",
    body: JSON.stringify({ guest_id: guestId }),
  });
}
