const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const errPayload = body?.error
    const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
    throw new Error((errPayload?.message || "Erro na requisição") + details)
  }

  return response.json()
}

// Categories - GET /catalog/categories
export async function fetchCategories() {
  return fetchApi<{ data: Category[] }>("/catalog/categories")
}

// Teams by Category - GET /catalog/categories/{categorySlug}/teams
export async function fetchTeamsByCategory(categorySlug: string) {
  return fetchApi<{ data: Team[] }>(`/catalog/categories/${categorySlug}/teams`)
}

// Models (Products) by Team - GET /catalog/teams/{teamSlug}/models
export async function fetchModelsByTeam(teamSlug: string) {
  return fetchApi<{ data: Model[] }>(`/catalog/teams/${teamSlug}/models`)
}

// Model Detail - GET /catalog/teams/{teamSlug}/models/{modelId}
export async function fetchModelDetail(teamSlug: string, modelId: string) {
  return fetchApi<{ data: ModelDetail }>(`/catalog/teams/${teamSlug}/models/${modelId}`)
}

// Simple Model Detail by ID - uses featured endpoint
export async function fetchProductById(modelId: string) {
  const res = await fetchFeaturedProducts(50)
  const product = res.data.find((p: Model) => p.id === modelId)
  if (product) {
    try {
      const detail = await fetchModelDetail(product.teamSlug, modelId)
      return {
        data: {
          ...product,
          ...detail.data,
          thumbnailUrl: detail.data.thumbnailUrl || product.thumbnailUrl || product.imageUrl,
          imageUrl: detail.data.imageUrl || product.imageUrl,
          images: detail.data.images,
        },
      }
    } catch {
      return { data: product }
    }
  }
  throw new Error("Product not found")
}

// Public Products by Team - GET /catalog/teams/{teamSlug}/products
export async function fetchProductsByTeam(teamSlug: string) {
  return fetchApi<{ data: ProductView[] }>(`/catalog/teams/${teamSlug}/products`)
}

// Featured Products - GET /catalog/featured
export async function fetchFeaturedProducts(limit = 8) {
  return fetchApi<{ data: Model[] }>(`/catalog/featured?limit=${limit}`)
}

// All Products (for search/sitemap) - uses featured endpoint
export async function fetchPublicModels() {
  return fetchApi<{ data: Model[] }>("/catalog/featured?limit=50")
}

// Orders - GET /orders
export async function fetchOrders() {
  return fetchApi<{ data: Order[] }>("/orders")
}

// Order Detail - GET /orders/{orderId}
export async function fetchOrder(orderId: string) {
  return fetchApi<{ data: Order }>(`/orders/${orderId}`)
}

// Shipping Quotes - POST /checkout/shipping/quotes
export async function fetchShippingQuotes(cep: string, state: string, itemsCount: number) {
  const response = await fetch("/api/checkout/shipping/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destination: { cep, state },
      itemsCount,
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
  const response = await fetch("/api/payment/requests", {
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

// Auth Session - GET /auth/session
export async function fetchAuthSession() {
  return fetchApi<{ data: AuthSession }>("/auth/session")
}

// Admin Products - GET /admin/products
export async function fetchAdminProducts() {
  return fetchApi<{ data: AdminProduct[] }>("/admin/products")
}

export async function createAdminProduct(product: CreateProductRequest) {
  return fetchApi<{ data: AdminProduct }>("/admin/products", {
    method: "POST",
    body: JSON.stringify(product),
  })
}

export async function updateAdminProduct(productId: string, product: UpdateProductRequest) {
  return fetchApi<{ data: AdminProduct }>(`/admin/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(product),
  })
}

export async function deleteAdminProduct(productId: string) {
  return fetchApi<{ data: AdminProduct }>(`/admin/products/${productId}`, {
    method: "DELETE",
  })
}

// Admin Categories
export async function fetchAdminCategories() {
  return fetchApi<{ data: Category[] }>("/admin/categories")
}

export async function createAdminCategory(category: { name: string; slug: string; displayOrder?: number }) {
  return fetchApi<{ data: Category }>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(category),
  })
}

export async function updateAdminCategory(id: string, category: { name: string; slug: string; displayOrder?: number }) {
  return fetchApi<{ data: Category }>(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(category),
  })
}

export async function deleteAdminCategory(id: string) {
  return fetchApi<{ data: void }>(`/admin/categories/${id}`, {
    method: "DELETE",
  })
}

// Admin Teams
export async function fetchAdminTeams() {
  return fetchApi<{ data: Team[] }>("/admin/teams")
}

export async function createAdminTeam(team: {
  name: string; slug: string; categoryId: string; league?: string; displayOrder?: number
}) {
  return fetchApi<{ data: Team }>("/admin/teams", {
    method: "POST",
    body: JSON.stringify(team),
  })
}

export async function updateAdminTeam(id: string, team: {
  name: string; slug: string; categoryId: string; league?: string; displayOrder?: number
}) {
  return fetchApi<{ data: Team }>(`/admin/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(team),
  })
}

export async function deleteAdminTeam(id: string) {
  return fetchApi<{ data: void }>(`/admin/teams/${id}`, {
    method: "DELETE",
  })
}

// Admin Order Status
export async function updateOrderStatus(orderId: string, status: string) {
  return fetchApi<{ data: Order }>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

// Image Upload
export async function uploadImage(file: File) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await fetch(`${API_BASE_URL}/admin/media/upload`, {
    method: "POST",
    body: formData,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const errPayload = body?.error
    const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
    throw new Error((errPayload?.message || "Erro no upload") + details)
  }
  return response.json() as Promise<{ data: { url: string; filename: string } }>
}

// Types
export interface Category {
  id: string
  name: string
  slug: string
  displayOrder?: number
  active?: boolean
}
export interface Category {
  id: string
  name: string
  slug: string
}

export interface Team {
  id: string
  name: string
  slug: string
  categoryId?: string
  categorySlug?: string
  league?: string
  displayOrder?: number
  active?: boolean
}

export interface Model {
  id: string
  teamSlug: string
  modelName: string
  description?: string
  price: number
  originalPrice?: number
  thumbnailUrl?: string
  imageUrl?: string
  customizationEnabled?: boolean
  customizationTemplatePng?: string
  customizationTemplateMetadata?: string
  available?: boolean
  stockQuantity?: number
  variants?: Variant[]
}

export interface ModelDetail extends Model {
  images?: string[]
}

export interface Variant {
  size: string
  stockQuantity: number
  available: boolean
}

export interface ProductView {
  id: string
  modelName: string
  slug: string
  teamSlug: string
  imageUrl?: string
  displayOrder: number
  stockQuantity: number
}

export interface ShippingQuoteResponse {
  provider: string
  options: ShippingQuote[]
}

export interface ShippingQuote {
  id: string
  label: string
  price: number
  estimatedDays: string
}

export interface PaymentRequest {
  checkoutSessionId: string
  idempotencyKey: string
  method: "pix" | "card"
  payer: {
    email: string
    identification: { type: "CPF" | "CNPJ"; number: string }
  }
  shippingAddress: {
    cep: string
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
  }
  shipping: {
    optionId: string
    label: string
    price: number
  }
  items: Array<{
    productId: string
    size: string
    quantity: number
    unitPrice: number
  }>
  card?: {
    token: string
    paymentMethodId: string
    installments: number
  }
}

export interface PaymentResponse {
  paymentId: string
  orderReference: string
  provider: string
  method: "pix" | "card"
  status: string
  statusDetail: string
  installments?: number
  pix?: {
    qrCode: string
    qrCodeBase64: string
    copyPasteCode: string
  }
}

export interface Order {
  id: string
  orderReference: string
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: string
  total: number
  items: Array<{
    productId: string
    name: string
    size: string
    quantity: number
    unitPrice: number
  }>
  shipping?: {
    address: string
    trackingCode?: string
  }
}

export interface AuthSession {
  userId: string
  email: string
  role: "admin" | "client"
}

export interface AdminProduct {
  id: string
  categorySlug: string
  teamSlug: string
  modelName: string
  description?: string
  price: number
  originalPrice?: number
  imageUrl?: string
  customizationEnabled: boolean
  customizationTemplatePng?: string
  customizationTemplateMetadata?: Record<string, unknown> | null
  active: boolean
  available: boolean
  stockQuantity: number
  variants: Variant[]
}

export interface CreateProductRequest {
  categorySlug: string
  teamSlug: string
  modelName: string
  description?: string
  price: number
  originalPrice?: number
  imageUrl?: string
  customizationEnabled: boolean
  customizationTemplatePng?: string
  customizationTemplateMetadata?: Record<string, unknown> | null
  variants: Array<{ size: string; stockQuantity: number }>
}

export interface UpdateProductRequest {
  categorySlug: string
  teamSlug: string
  modelName: string
  description?: string
  price: number
  originalPrice?: number
  imageUrl?: string
  customizationEnabled: boolean
  customizationTemplatePng?: string
  customizationTemplateMetadata?: Record<string, unknown> | null
  variants: Array<{ size: string; stockQuantity: number }>
}
