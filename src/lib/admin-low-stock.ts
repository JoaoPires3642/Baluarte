import type { AdminProduct, Variant } from "@/lib/api"

export const ADMIN_STOCK_SIZES = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"]

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
  return products.flatMap(product =>
    ADMIN_STOCK_SIZES.map(size => product.variants.find(variant => variant.size === size) || { size, stockQuantity: 0, available: false })
      .filter(variant => variant.stockQuantity < threshold)
      .map(variant => ({ product, variant }))
  )
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
