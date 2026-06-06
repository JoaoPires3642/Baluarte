import type { AdminProduct } from "@/lib/api"

export const SIZES = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"]
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

export type LowStockVariant = {
  product: AdminProduct
  variant: AdminProduct["variants"][number]
}
