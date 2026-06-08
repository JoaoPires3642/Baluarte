import { ADMIN_STOCK_SIZES } from "@/lib/admin-low-stock"
import type { AdminLowStockVariant } from "@/lib/admin-low-stock"

export const SIZES = ADMIN_STOCK_SIZES
export const STEPS = ["Informações", "Preço & Estoque", "Imagem"]
export const LOW_STOCK_THRESHOLD = 5

export type ProductFormData = {
  modelName: string
  description: string
  price: string
  originalPrice: string
  categorySlug: string
  teamSlug: string
  imageUrl: string
  imageUrls: string[]
  featured: boolean
  variants: Record<string, string>
}

export const emptyForm: ProductFormData = {
  modelName: "",
  description: "",
  price: "",
  originalPrice: "",
  categorySlug: "",
  teamSlug: "",
  imageUrl: "",
  imageUrls: [],
  featured: false,
  variants: Object.fromEntries(SIZES.map(size => [size, "0"])),
}

export type LowStockVariant = AdminLowStockVariant
