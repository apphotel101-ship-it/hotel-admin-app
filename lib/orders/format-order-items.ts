import type { OrderRow } from "./types";

/**
 * Builds the primary line from `items`: "A + B ×2" (qty 1 omits ×).
 * Falls back to `service` when items are missing or empty.
 */
export function formatOrderItemsTitle(row: Pick<OrderRow, "items" | "service">): string {
  const items = row.items;
  if (!items || typeof items !== "object") {
    return row.service;
  }

  const entries = Object.entries(items).filter(([, qty]) => Number(qty) > 0);
  if (entries.length === 0) {
    return row.service;
  }

  const parts = entries.map(([name, qty]) => {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 1) {
      return name;
    }
    return `${name} ×${n}`;
  });

  return parts.join(" + ");
}
