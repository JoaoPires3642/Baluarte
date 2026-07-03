import { getBrowserSafeApiBaseUrl } from "@/lib/api-base"
import { apiFetch } from "@/lib/api-client"
import { fetchAdminApi } from "./client"
import type {
  AdminProduct,
  AdminShippingSettings,
  AdminShippingSettingsUpdate,
  Category,
  CreateProductRequest,
  Team,
  UpdateProductRequest,
} from "./types"

// Admin Products - GET /admin/products
export async function fetchAdminProducts() {
  return fetchAdminApi<{ data: AdminProduct[] }>("/products")
}

export async function createAdminProduct(product: CreateProductRequest) {
  return fetchAdminApi<{ data: AdminProduct }>("/products", {
    method: "POST",
    body: JSON.stringify(product),
  })
}

export async function updateAdminProduct(productId: string, product: UpdateProductRequest) {
  return fetchAdminApi<{ data: AdminProduct }>(`/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(product),
  })
}

export async function deleteAdminProduct(productId: string) {
  return fetchAdminApi<{ data: AdminProduct }>(`/products/${productId}`, {
    method: "DELETE",
  })
}

// Admin Categories
export async function fetchAdminCategories() {
  return fetchAdminApi<{ data: Category[] }>("/categories")
}

export async function createAdminCategory(category: { name: string; slug: string; displayOrder?: number }) {
  return fetchAdminApi<{ data: Category }>("/categories", {
    method: "POST",
    body: JSON.stringify(category),
  })
}

export async function updateAdminCategory(id: string, category: { name: string; slug: string; displayOrder?: number }) {
  return fetchAdminApi<{ data: Category }>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(category),
  })
}

export async function deleteAdminCategory(id: string) {
  return fetchAdminApi<{ data: void }>(`/categories/${id}`, {
    method: "DELETE",
  })
}

// Admin Teams
export async function fetchAdminTeams() {
  return fetchAdminApi<{ data: Team[] }>("/teams")
}

export async function createAdminTeam(team: {
  name: string; slug: string; categoryId: string; league?: string; displayOrder?: number
}) {
  return fetchAdminApi<{ data: Team }>("/teams", {
    method: "POST",
    body: JSON.stringify(team),
  })
}

export async function updateAdminTeam(id: string, team: {
  name: string; slug: string; categoryId: string; league?: string; displayOrder?: number
}) {
  return fetchAdminApi<{ data: Team }>(`/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(team),
  })
}

export async function deleteAdminTeam(id: string) {
  return fetchAdminApi<{ data: void }>(`/teams/${id}`, {
    method: "DELETE",
  })
}

// Admin Shipping Settings
export async function fetchAdminShippingSettings() {
  const url = typeof window === "undefined" ? `${getBrowserSafeApiBaseUrl()}/admin/shipping-settings` : "/api/admin/admin/shipping-settings"
  const response = await apiFetch(url, { cache: "no-store" })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message || "Erro ao carregar configuracoes de frete")
  }
  return response.json() as Promise<{ data: AdminShippingSettings }>
}

export async function updateAdminShippingSettings(settings: AdminShippingSettingsUpdate) {
  const response = await apiFetch("/api/admin/admin/shipping-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const details = body?.error?.details?.length ? ": " + body.error.details.join("; ") : ""
    throw new Error((body?.error?.message || "Erro ao salvar configuracoes de frete") + details)
  }
  return response.json() as Promise<{ data: AdminShippingSettings }>
}
