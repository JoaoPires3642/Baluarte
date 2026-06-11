import { AlertTriangle } from "lucide-react"
import type { AdminProduct } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LOW_STOCK_THRESHOLD, type LowStockVariant, getSizes } from "./admin-products-types"

type ProductStockSectionProps = {
  products: AdminProduct[]
  lowStockVariants: LowStockVariant[]
  lowStockOnly: boolean
  onEditStock: (product: AdminProduct) => void
}

export function ProductStockSection({ products, lowStockVariants, lowStockOnly, onEditStock }: ProductStockSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{lowStockOnly ? "Produtos em falta" : "Estoque"}</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            {lowStockOnly ? `Tamanhos abaixo de ${LOW_STOCK_THRESHOLD} unidades no filtro atual.` : "Visão geral do estoque por tamanho dos produtos filtrados."}
          </p>
        </div>
        <Badge variant={lowStockVariants.length > 0 ? "warning" : "success"}>
          {lowStockVariants.length} item(ns) em falta
        </Badge>
      </CardHeader>
      <CardContent>
        {lowStockOnly ? (
          <LowStockReport rows={lowStockVariants} onEditStock={onEditStock} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(product => <ProductStockCard key={product.id} product={product} onEditStock={onEditStock} />)}
          </div>
        )}
        {!lowStockOnly && products.length === 0 && <p className="py-8 text-center text-slate-500">Nenhum estoque encontrado</p>}
      </CardContent>
    </Card>
  )
}

function LowStockReport({ rows, onEditStock }: { rows: LowStockVariant[]; onEditStock: (product: AdminProduct) => void }) {
  if (rows.length === 0) return <p className="py-8 text-center text-slate-500">Nenhum produto em falta no filtro atual</p>

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-yellow-800">
        <AlertTriangle className="h-4 w-4" /> Itens que precisam de reposição
      </div>
      <div className="overflow-x-auto rounded-xl border border-yellow-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-yellow-50 text-left text-xs font-bold uppercase tracking-[0.12em] text-yellow-900">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3 text-center">Tamanho</th>
              <th className="px-4 py-3 text-center">Estoque</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, variant }) => (
              <tr key={`${product.id}-${variant.size}`} className="border-t border-yellow-100">
                <td className="px-4 py-3 font-medium text-slate-900">{product.modelName}</td>
                <td className="px-4 py-3 text-slate-500">{product.teamSlug}</td>
                <td className="px-4 py-3 text-center font-semibold">{variant.size}</td>
                <td className="px-4 py-3 text-center"><span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">{variant.stockQuantity} un.</span></td>
                <td className="px-4 py-3 text-right"><Button variant="outline" size="sm" onClick={() => onEditStock(product)}>Repor</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProductStockCard({ product, onEditStock }: { product: AdminProduct; onEditStock: (product: AdminProduct) => void }) {
  const sizes = getSizes(product.sizeCategory || "ADULTO")
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{product.modelName}</p>
          <p className="mt-1 text-xs text-slate-500">{product.teamSlug} - {product.categorySlug}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onEditStock(product)}>Repor</Button>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {sizes.map(size => {
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
