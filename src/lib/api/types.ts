// Shared API types (responses/entities) used across domain modules.

export interface PublicModelsPageMeta {
  page: number
  size: number
  total: number
  totalPages: number
}

export interface Category {
  id: string
  name: string
  slug: string
  displayOrder?: number
  active?: boolean
  imageUrl?: string | null
  color?: string | null
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

export interface Variant {
  size: string
  stockQuantity: number
  available: boolean
}

export interface Model {
  id: string
  categorySlug?: string
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
  featured?: boolean
  available?: boolean
  active?: boolean
  stockQuantity?: number
  variants?: Variant[]
  createdAt?: string
  salesCount?: number
}

export type ModelDetail = Model

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

export interface ShippingQuote {
  id: string
  label: string
  price: number
  estimatedDays: string
}

export interface ShippingQuoteResponse {
  provider: string
  options: ShippingQuote[]
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
    phone?: string
    additionalInfo?: string
  }
  shipping: {
    optionId: string
    label: string
    price: number
  }
  shippingType?: string
  deliveryStation?: string
  deliveryDay?: string
  deliveryDate?: string
  deliveryTimeSlot?: string
  items: Array<{
    productId: string
    size: string
    quantity: number
    unitPrice: number
    customNames?: string[]
    customNumber?: string
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
  orderId: string
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
  updatedAt?: string
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
    shippingType?: string
    deliveryStation?: string
    deliveryDay?: string
    deliveryDate?: string
    deliveryTimeSlot?: string
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

export interface AdminShippingPackageOption {
  name: string
  maxQuantity: number
  heightCm: number
  widthCm: number
  lengthCm: number
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
  packageOptions: AdminShippingPackageOption[]
  automaticLabelEnabled?: boolean
  automaticLabelRunTime?: string
  automaticLabelCutoffTime?: string
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
  featured?: boolean
  active: boolean
  available: boolean
  stockQuantity: number
  sizeCategory?: string
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
  featured?: boolean
  variants: Array<{ size: string; stockQuantity: number }>
}

export type UpdateProductRequest = CreateProductRequest

export interface Address {
  addressId: string
  userId?: string
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

export interface CepLookupResult {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
}

export interface SiteContactSettings {
  footerMessage?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  businessHours?: string | null
  instagramUrl?: string | null
  facebookUrl?: string | null
  youtubeUrl?: string | null
  whatsappMessage?: string | null
  freeShippingMinValue?: number | null
}

export interface StationDeliverySettings {
  enabled: boolean
  price: number | null
  stations: Record<string, string[]> | null
  timeSlots: string[] | null
}
