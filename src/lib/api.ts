const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"
const PUBLIC_CATALOG_CACHE = { next: { revalidate: 60, tags: ["catalog"] } }

type ApiRequestInit = RequestInit & {
  next?: {
    revalidate?: number
    tags?: string[]
  }
}

async function fetchApi<T>(endpoint: string, options?: ApiRequestInit): Promise<T> {
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
  return fetchApi<{ data: Category[] }>("/catalog/categories", PUBLIC_CATALOG_CACHE)
}

export async function fetchPublicTeams(limit = 8) {
  return fetchApi<{ data: Team[] }>(`/catalog/teams?limit=${limit}`, PUBLIC_CATALOG_CACHE)
}

// Teams by Category - GET /catalog/categories/{categorySlug}/teams
export async function fetchTeamsByCategory(categorySlug: string) {
  return fetchApi<{ data: Team[] }>(`/catalog/categories/${categorySlug}/teams`, PUBLIC_CATALOG_CACHE)
}

// Models (Products) by Team - GET /catalog/teams/{teamSlug}/models
export async function fetchModelsByTeam(teamSlug: string) {
  return fetchApi<{ data: Model[] }>(`/catalog/teams/${teamSlug}/models`, PUBLIC_CATALOG_CACHE)
}

// Model Detail - GET /catalog/teams/{teamSlug}/models/{modelId}
export async function fetchModelDetail(teamSlug: string, modelId: string) {
  return fetchApi<{ data: ModelDetail }>(`/catalog/teams/${teamSlug}/models/${modelId}`, PUBLIC_CATALOG_CACHE)
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
  return fetchApi<{ data: Model[] }>(`/catalog/featured?limit=${limit}`, PUBLIC_CATALOG_CACHE)
}

// All Products (for search/sitemap) - uses featured endpoint
export async function fetchPublicModels() {
  return fetchApi<{ data: Model[] }>("/catalog/featured?limit=50", PUBLIC_CATALOG_CACHE)
}

// Orders - GET /orders
export async function fetchOrders() {
  return fetchApi<{ data: Order[] }>("/orders")
}

export async function fetchMyOrders() {
  const response = await fetch("/api/orders", { cache: "no-store" })
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
  const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const errPayload = body?.error
    throw new Error(errPayload?.message || "Erro ao carregar pedido")
  }
  return response.json() as Promise<{ data: Order }>
}

// Shipping Quotes - POST /checkout/shipping/quotes
export async function fetchShippingQuotes(destination: {
  cep: string; street: string; number: string; neighborhood: string; city: string; state: string
}, itemsCount: number) {
  const response = await fetch("/api/checkout/shipping/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destination,
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

export async function createShippingLabel(orderId: string) {
  return fetchApi<{ data: Order }>(`/orders/${orderId}/shipping-label`, {
    method: "POST",
  })
}

export async function fetchAdminShippingSettings() {
  const url = typeof window === "undefined" ? `${API_BASE_URL}/admin/shipping-settings` : "/api/admin/admin/shipping-settings"
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message || "Erro ao carregar configuracoes de frete")
  }
  return response.json() as Promise<{ data: AdminShippingSettings }>
}

export async function updateAdminShippingSettings(settings: AdminShippingSettingsUpdate) {
  const response = await fetch("/api/admin/admin/shipping-settings", {
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

// Image Upload
export async function uploadImage(
  file: File,
  auth?: { token: string; userId: string; email?: string }
) {
  const formData = new FormData()
  formData.append("file", file)
  const headers: Record<string, string> = {}
  if (auth) {
    headers["Authorization"] = `Bearer ${auth.token}`
    headers["X-Clerk-User-Id"] = auth.userId
    if (auth.email) headers["X-Clerk-Email"] = auth.email
  }
  const response = await fetch(`${API_BASE_URL}/admin/media/upload`, {
    method: "POST",
    headers,
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
  logo?: string
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
  images?: string[]
  customizationEnabled?: boolean
  customizationTemplatePng?: string
  customizationTemplateMetadata?: string
  available?: boolean
  active?: boolean
  stockQuantity?: number
  variants?: Variant[]
}

export interface ModelDetail extends Model {}

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
  images?: string[]
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
    recipientName: string
    cep: string
    street: string
    number: string
    complement?: string
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
    issuerId?: string
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
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "pending_payment"
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
    recipientName?: string
    address: string
    trackingCode?: string
    provider?: string
    serviceId?: string
    serviceName?: string
    labelId?: string
    labelUrl?: string
  }
  payment?: {
    method: string
    pixQrCode?: string
    pixQrCodeBase64?: string
    pixCopyPasteCode?: string
  }
}

export interface PaginationMeta {
  page: number
  size: number
  total: number
  totalPages: number
}

export interface AdminShippingSettings {
  provider: string
  originCep: string
  packageWeightKg: number
  packageHeightCm: number
  packageWidthCm: number
  packageLengthCm: number
  superfreteBaseUrl: string
  superfreteTokenConfigured: boolean
  superfreteServices: string
  superfreteUserAgent: string
  superfreteCartPath: string
  superfreteCheckoutPath: string
  superfreteLabelLinkPath: string
  senderName: string
  senderPhone: string
  senderEmail: string
  senderDocument: string
  senderStreet: string
  senderNumber: string
  senderComplement: string
  senderDistrict: string
  senderCity: string
  senderState: string
}

export type AdminShippingSettingsUpdate = AdminShippingSettings & {
  superfreteToken?: string
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
  images?: string[]
  customizationEnabled: boolean
  customizationTemplatePng?: string
  customizationTemplateMetadata?: Record<string, unknown> | null
  active: boolean
  available: boolean
  stockQuantity: number
  variants: Variant[]
}

export interface AdminProductDashboardSummary {
  totalActiveProducts: number
  lowStockVariants: Array<{
    productId: string
    productName: string
    size: string
    stockQuantity: number
  }>
}

export interface CreateProductRequest {
  categorySlug: string
  teamSlug: string
  modelName: string
  description?: string
  price: number
  originalPrice?: number
  imageUrl?: string
  images?: string[]
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
  images?: string[]
  customizationEnabled: boolean
  customizationTemplatePng?: string
  customizationTemplateMetadata?: Record<string, unknown> | null
  variants: Array<{ size: string; stockQuantity: number }>
}

export interface Address {
  addressId: string
  clerkUserId: string
  recipientName?: string
  label: string
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  isDefault: boolean
}

type AddressApiResponse = Omit<Address, "addressId" | "clerkUserId"> & {
  id?: string
  addressId?: string
  clerkUserId?: string
}

function normalizeAddress(address: AddressApiResponse): Address {
  return {
    ...address,
    addressId: address.addressId || address.id || "",
    clerkUserId: address.clerkUserId || "",
  }
}

export interface CepLookupResult {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
}

export async function lookupCep(cep: string): Promise<CepLookupResult> {
  const res = await fetch(`/api/cep/lookup?cep=${cep}`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || "Erro ao consultar CEP")
  }
  return res.json()
}

export async function fetchAddresses(): Promise<Address[]> {
  const res = await fetch("/api/profile/addresses")
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const errPayload = body?.error
    throw new Error(errPayload?.message || errPayload || "Erro ao carregar endereços")
  }
  const json = await res.json()
  return (json.data || []).map(normalizeAddress)
}

export async function syncAddresses(addresses: Array<{
  addressId?: string
  label: string
  recipientName?: string
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  isDefault: boolean
}>, defaultAddressId?: string) {
  const res = await fetch("/api/profile/addresses", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      addresses: addresses.map(({ addressId, ...address }) => ({
        ...address,
        id: addressId,
      })),
      defaultAddressId,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const errPayload = body?.error
    const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
    throw new Error((errPayload?.message || "Erro ao salvar endereços") + details)
  }
  const json = await res.json()
  return {
    ...json,
    data: (json.data || []).map(normalizeAddress),
  }
}
