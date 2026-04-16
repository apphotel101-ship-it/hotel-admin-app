export type OrderStatus =
  | "PLACED"
  | "IN_PROGRESS"
  | "READY"
  | "ACKNOWLEDGED"
  | "DELIVERED"
  | string;

export type OrderRow = {
  order_id: number;
  guest_name: string;
  room_number: string;
  service: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  /** Item name → quantity from search API */
  items?: Record<string, number>;
};

export type OrdersSearchResponse = {
  orders: OrderRow[];
  total: number;
};

/** Single line item from GET /api/v1/orders/{order_id} */
export type OrderDetailItem = {
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  image_snapshot?: string;
};

/** Response from GET /api/v1/orders/{order_id} */
export type OrderDetail = {
  order_id: number;
  service: string;
  status: string;
  instructions: string | null;
  total_amount: number;
  is_billable: boolean;
  items: OrderDetailItem[];
};
