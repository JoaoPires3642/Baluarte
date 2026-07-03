import { apiFetch } from "@/lib/api-client"
import { fetchApi } from "./client"
import type { Order } from "./types"

// Orders - GET /orders
export async function fetchOrders() {
  return fetchApi<{ data: Order[] }>("/orders")
}

export async function fetchMyOrders() {
  const response = await apiFetch("/api/orders", { cache: "no-store" })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const errPayload = body?.error
    throw new Error(errPayload?.message || "Erro ao carregar pedidos")
  }
  return response.json() as Promise<{ data: Order[] }>
}

// Order Detail - GET /orders/{orderId}
export async function fetchOrder(orderId: string) {
  return fetchApi<{ data: Order }>(`/orders/${orderId}`)
}

export async function fetchMyOrder(orderId: string) {
  const response = await apiFetch(`/api/orders/${orderId}`, { cache: "no-store" })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const errPayload = body?.error
    throw new Error(errPayload?.message || "Erro ao carregar pedido")
  }
  return response.json() as Promise<{ data: Order }>
}

// Admin Order Status
export async function updateOrderStatus(orderId: string, status: string) {
  return fetchApi<{ data: Order }>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function createShippingLabel(orderId: string) {
  return fetchApi<{ data: Order }>(`/orders/${orderId}/shipping-label`, {
    method: "POST",
  })
}
