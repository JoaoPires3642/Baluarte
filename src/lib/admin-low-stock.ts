import type { AdminProduct, Variant } from "@/lib/api"

export const ADULT_SIZES = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"]
export const CHILD_SIZES = ["2", "4", "6", "8", "10", "12", "14"]

export function getSizesForCategory(category?: string): string[] {
  return category === "INFANTIL" ? CHILD_SIZES : ADULT_SIZES
}

export type AdminLowStockVariant = {
  product: AdminProduct
  variant: Variant
}

export type AdminLowStockReportItem = {
  productId: string
  productName: string
  categorySlug: string
  teamSlug: string
  size: string
  stockQuantity: number
}

export function getAdminLowStockVariants(products: AdminProduct[], threshold: number): AdminLowStockVariant[] {
  return products.flatMap(product => {
    const sizes = getSizesForCategory(product.sizeCategory)
    return sizes.map(size => product.variants.find(variant => variant.size === size) || { size, stockQuantity: 0, available: false })
      .filter(variant => variant.stockQuantity < threshold)
      .map(variant => ({ product, variant }))
  })
}

export function toAdminLowStockReportItems(items: AdminLowStockVariant[]): AdminLowStockReportItem[] {
  return items.map(({ product, variant }) => ({
    productId: product.id,
    productName: product.modelName,
    categorySlug: product.categorySlug,
    teamSlug: product.teamSlug,
    size: variant.size,
    stockQuantity: variant.stockQuantity,
  }))
}
