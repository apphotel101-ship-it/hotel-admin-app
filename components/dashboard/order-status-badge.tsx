import type { OrderStatus } from "@/lib/orders/types";

function badgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "PLACED") return "badge b-amber";
  if (s === "IN_PROGRESS") return "badge b-blue";
  if (s === "READY") return "badge b-green";
  if (s === "ACKNOWLEDGED") return "badge b-gold";
  if (s === "DELIVERED") return "badge b-slate";
  return "badge b-slate";
}

function badgeLabel(status: string): string {
  const s = status.toUpperCase();
  if (s === "IN_PROGRESS") return "On way";
  if (s === "ACKNOWLEDGED") return "Acknowledged";
  if (s === "PLACED") return "Placed";
  if (s === "READY") return "Ready";
  if (s === "DELIVERED") return "Delivered";
  return status.replace(/_/g, " ");
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const normalized = String(status);
  return <span className={badgeClass(normalized)}>{badgeLabel(normalized)}</span>;
}
