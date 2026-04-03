import { useState } from "react";

import { mockOrders } from "../lib/data";
import type { Order } from "../lib/types";

export function useOrdersState() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  return {
    orders,
    setOrders
  };
}
