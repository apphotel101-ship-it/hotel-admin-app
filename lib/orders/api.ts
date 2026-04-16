import type { AuthFetchOptions } from "@/lib/auth/api";
import type { OrderDetail, OrderStatus, OrdersSearchResponse } from "./types";

type AuthenticatedFetch = <T>(path: string, init?: AuthFetchOptions) => Promise<T>;

export function searchOrdersByStatus(
  fetcher: AuthenticatedFetch,
  statuses: OrderStatus[],
): Promise<OrdersSearchResponse> {
  return fetcher<OrdersSearchResponse>("/api/v1/orders/search", {
    method: "POST",
    body: JSON.stringify({ status: statuses }),
  });
}

/**
 * Marks a placed order as acknowledged so it appears under active requests.
 * Adjust this call if your backend uses a different path or payload.
 */
export function acknowledgeOrder(fetcher: AuthenticatedFetch, orderId: number): Promise<unknown> {
  return fetcher(`/api/v1/admin/orders/${orderId}/acknowledge`, {
    method: "PATCH",
    body: JSON.stringify({ "order_id": `${orderId}`,status: "ACKNOWLEDGED" }),
  });
}

export function getOrderById(fetcher: AuthenticatedFetch, orderId: number): Promise<OrderDetail> {
  return fetcher<OrderDetail>(`/api/v1/orders/${orderId}`, {
    method: "GET",
  });
}

/** Update order status from admin modal. */
export function updateOrderFromModal(
  fetcher: AuthenticatedFetch,
  orderId: number,
  payload: { status: string; comment: string },
): Promise<unknown> {
  return fetcher(`/api/v1/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
