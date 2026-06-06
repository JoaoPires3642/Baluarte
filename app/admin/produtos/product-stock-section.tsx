import { AlertTriangle } from "lucide-react"
import type { AdminProduct } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LOW_STOCK_THRESHOLD, type LowStockVariant, SIZES } from "./admin-products-types"

type ProductStockSectionProps = {
  products: AdminProduct[]
  lowStockVariants: LowStockVariant[]
  onEdit: (product: AdminProduct) => void
}

export function ProductStockSection({ products, lowStockVariants, onEdit }: ProductStockSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Estoque</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Produtos cadastrados no filtro atual com alerta de baixa quantidade.</p>
        </div>
        <Badge variant={lowStockVariants.length > 0 ? "warning" : "success"}>
          {lowStockVariants.length} item(ns) em falta
        </Badge>
      </CardHeader>
      <CardContent>
        {lowStockVariants.length > 0 ? <LowStockReport rows={lowStockVariants} onEdit={onEdit} /> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => <ProductStockCard key={product.id} product={product} onEdit={onEdit} />)}
        </div>
        {products.length === 0 && <p className="py-8 text-center text-slate-500">Nenhum estoque encontrado</p>}
      </CardContent>
    </Card>
  )
}

function LowStockReport({ rows, onEdit }: { rows: LowStockVariant[]; onEdit: (product: AdminProduct) => void }) {
  return (
    <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-yellow-800">
        <AlertTriangle className="h-4 w-4" /> Relatório de baixa quantidade
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ product, variant }) => (
          <button key={`${product.id}-${variant.size}`} type="button" onClick={() => onEdit(product)} className="rounded-lg border border-yellow-200 bg-white p-3 text-left text-sm hover:border-yellow-400">
            <span className="block font-semibold text-slate-900">{product.modelName}</span>
            <span className="mt-1 block text-xs text-slate-500">{product.teamSlug} - Tam. {variant.size}</span>
            <span className="mt-2 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{variant.stockQuantity} un.</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ProductStockCard({ product, onEdit }: { product: AdminProduct; onEdit: (product: AdminProduct) => void }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{product.modelName}</p>
          <p className="mt-1 text-xs text-slate-500">{product.teamSlug} - {product.categorySlug}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onEdit(product)}>Repor</Button>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {SIZES.map(size => {
          const stockQuantity = product.variants.find(variant => variant.size === size)?.stockQuantity ?? 0
          const lowStock = stockQuantity < LOW_STOCK_THRESHOLD
          return (
            <div key={size} className={`rounded-lg border p-2 text-center ${lowStock ? "border-red-200 bg-red-50" : "border-slate-100 bg-slate-50"}`}>
              <p className="text-[11px] font-bold text-slate-500">{size}</p>
              <p className={`text-sm font-bold ${lowStock ? "text-red-600" : "text-slate-900"}`}>{stockQuantity}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
