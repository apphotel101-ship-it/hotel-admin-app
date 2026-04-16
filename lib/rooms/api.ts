import type { AuthFetchOptions } from "@/lib/auth/api";
import type { AdminRoomsResponse } from "./types";

type AuthenticatedFetch = <T>(path: string, init?: AuthFetchOptions) => Promise<T>;

export function fetchAdminRooms(fetcher: AuthenticatedFetch): Promise<AdminRoomsResponse> {
  return fetcher<AdminRoomsResponse>("/api/v1/admin/rooms", {
    method: "GET",
  });
}
