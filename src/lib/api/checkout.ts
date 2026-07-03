import { apiFetch } from "@/lib/api-client"
import type { PaymentRequest, PaymentResponse, ShippingQuoteResponse, StationDeliverySettings } from "./types"

// Station Delivery - GET /checkout/shipping/station-settings
export async function fetchStationDeliverySettings() {
  const response = await apiFetch("/api/checkout/shipping/station-settings", {
    cache: "no-store",
  })
  if (!response.ok) return null
  const json = await response.json()
  return json.data as StationDeliverySettings
}

const DAYS_OF_WEEK: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
}

export { DAYS_OF_WEEK as deliveryDayLabels }

// Shipping Quotes - POST /checkout/shipping/quotes
export async function fetchShippingQuotes(destination: {
  cep: string; street: string; number: string; neighborhood: string; city: string; state: string
}, itemsCount: number, hasPersonalization = false) {
  const response = await apiFetch("/api/checkout/shipping/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destination,
      itemsCount,
      hasPersonalization,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const errPayload = body?.error
    const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
    throw new Error((errPayload?.message || "Erro na requisição") + details)
  }

  return response.json() as Promise<{ data: ShippingQuoteResponse }>
}

// Payment - POST /payment/requests
export async function createPayment(payload: PaymentRequest) {
  const response = await apiFetch("/api/payment/requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const errPayload = body?.error
    const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
    throw new Error((errPayload?.message || "Erro na requisição") + details)
  }

  return response.json() as Promise<{ data: PaymentResponse }>
}
