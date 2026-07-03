import { fetchApi, CATALOG_CACHE } from "./client"
import type { Category, Model, ModelDetail, ProductView, PublicModelsPageMeta, Team } from "./types"

export async function fetchCategories() {
  return fetchApi<{ data: Category[] }>("/catalog/categories", CATALOG_CACHE)
}

export async function fetchPublicTeams(limit = 8) {
  return fetchApi<{ data: Team[] }>(`/catalog/teams?limit=${limit}`, CATALOG_CACHE)
}

// Teams by Category - GET /catalog/categories/{categorySlug}/teams
export async function fetchTeamsByCategory(categorySlug: string) {
  return fetchApi<{ data: Team[] }>(`/catalog/categories/${categorySlug}/teams`, CATALOG_CACHE)
}

// Models (Products) by Team - GET /catalog/teams/{teamSlug}/models
export async function fetchModelsByTeam(teamSlug: string) {
  return fetchApi<{ data: Model[] }>(`/catalog/teams/${teamSlug}/models`, CATALOG_CACHE)
}

// Model Detail - GET /catalog/teams/{teamSlug}/models/{modelId}
export async function fetchModelDetail(teamSlug: string, modelId: string) {
  return fetchApi<{ data: ModelDetail }>(`/catalog/teams/${teamSlug}/models/${modelId}`, CATALOG_CACHE)
}

// Simple Model Detail by ID - uses featured endpoint
export async function fetchProductById(modelId: string) {
  return fetchApi<{ data: ModelDetail }>(`/catalog/products/${modelId}`, CATALOG_CACHE)
}

// Public Products by Team - GET /catalog/teams/{teamSlug}/products
export async function fetchProductsByTeam(teamSlug: string) {
  return fetchApi<{ data: ProductView[] }>(`/catalog/teams/${teamSlug}/products`, CATALOG_CACHE)
}

// Featured Products - GET /catalog/featured
export async function fetchFeaturedProducts(limit = 8) {
  return fetchApi<{ data: Model[] }>(`/catalog/featured?limit=${limit}`, CATALOG_CACHE)
}

// Personalized Products - GET /catalog/personalized
export async function fetchPersonalizedProducts(limit = 50) {
  return fetchApi<{ data: Model[] }>(`/catalog/personalized?limit=${limit}`, CATALOG_CACHE)
}

export async function fetchBestSellers(limit = 8) {
  return fetchApi<{ data: Model[] }>(`/catalog/best-sellers?limit=${limit}`, CATALOG_CACHE)
}

export async function fetchPublicModelsPage(page = 0, size = 10, query = "") {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (query.trim()) params.set("q", query.trim())
  return fetchApi<{ data: Model[]; meta: PublicModelsPageMeta }>(`/catalog/products?${params}`, CATALOG_CACHE)
}

export async function fetchPublicModels() {
  return fetchPublicModelsPage(0, 10)
}
