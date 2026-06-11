import { getSizesForCategory } from "@/lib/admin-low-stock"
import type { AdminLowStockVariant } from "@/lib/admin-low-stock"

export const SIZE_CATEGORIES = ["ADULTO", "INFANTIL"]
export const STEPS = ["Informações", "Preço & Estoque", "Imagem"]
export const LOW_STOCK_THRESHOLD = 5

export function getSizes(sizeCategory: string): string[] {
  return getSizesForCategory(sizeCategory)
}

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
  sizeCategory: string
  variants: Record<string, string>
}

const defaultSizes = getSizesForCategory("ADULTO")

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
  sizeCategory: "ADULTO",
  variants: Object.fromEntries(defaultSizes.map(size => [size, "0"])),
}

export type LowStockVariant = AdminLowStockVariant
