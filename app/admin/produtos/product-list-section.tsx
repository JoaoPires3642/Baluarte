import { Download, Eye, EyeOff, Pencil, Search, Trash2 } from "lucide-react"
import type { AdminProduct, Category, Team } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LOW_STOCK_THRESHOLD } from "./admin-products-types"

type ProductFiltersProps = {
  search: string
  categoryFilter: string
  teamFilter: string
  stockOnly: boolean
  lowStockOnly: boolean
  categories: Category[]
  teams: Team[]
  lowStockCount: number
  onSearchChange: (value: string) => void
  onCategoryFilterChange: (value: string) => void
  onTeamFilterChange: (value: string) => void
  onStockOnlyChange: () => void
  onLowStockOnlyChange: () => void
  onDownloadReport: () => void
  onClearFilters: () => void
}

type ProductListSectionProps = {
  products: AdminProduct[]
  onEdit: (product: AdminProduct) => void
  onToggleActive: (product: AdminProduct) => void
  onDeleteRequest: (productId: string) => void
}

type ProductActionProps = Omit<ProductListSectionProps, "products"> & {
  product: AdminProduct
}

export function ProductFilters(props: ProductFiltersProps) {
  const { search, categoryFilter, teamFilter, stockOnly, lowStockOnly, categories, teams, lowStockCount, onSearchChange, onCategoryFilterChange, onTeamFilterChange, onStockOnlyChange, onLowStockOnlyChange, onDownloadReport, onClearFilters } = props
  const visibleTeams = categoryFilter ? teams.filter(team => team.categorySlug === categoryFilter) : teams

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar produto..." className="max-w-sm pl-10" value={search} onChange={e => onSearchChange(e.target.value)} />
          </div>
          <select value={categoryFilter} onChange={e => onCategoryFilterChange(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">Todas categorias</option>
            {categories.map(category => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
          <select value={teamFilter} onChange={e => onTeamFilterChange(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">Todos times</option>
            {visibleTeams.map(team => <option key={team.slug} value={team.slug}>{team.name}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={stockOnly ? "default" : "outline"} size="sm" onClick={onStockOnlyChange}>Estoque</Button>
            <Button type="button" variant={lowStockOnly ? "destructive" : "outline"} size="sm" onClick={onLowStockOnlyChange}>Em falta</Button>
            <Button type="button" variant="outline" size="sm" onClick={onDownloadReport} disabled={lowStockCount === 0}><Download className="h-3.5 w-3.5" />Relatório</Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>Limpar</Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Filtre por categoria ou time. Use Estoque para conferir quantidades e Em falta para ver produtos abaixo de {LOW_STOCK_THRESHOLD} unidades por tamanho.
        </p>
      </CardContent>
    </Card>
  )
}

export function ProductListSection({ products, onEdit, onToggleActive, onDeleteRequest }: ProductListSectionProps) {
  return (
    <Card>
      <CardHeader><CardTitle>{products.length} produto(s)</CardTitle></CardHeader>
      <CardContent>
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left text-sm font-medium">Produto</th>
                <th className="pb-3 text-left text-sm font-medium">Time</th>
                <th className="pb-3 text-left text-sm font-medium">Preço</th>
                <th className="pb-3 text-left text-sm font-medium">Estoque</th>
                <th className="pb-3 text-left text-sm font-medium">Destaque</th>
                <th className="pb-3 text-left text-sm font-medium">Status</th>
                <th className="pb-3 text-right text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => <ProductTableRow key={product.id} product={product} onEdit={onEdit} onToggleActive={onToggleActive} onDeleteRequest={onDeleteRequest} />)}
              {products.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-500">Nenhum produto encontrado</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 sm:hidden">
          {products.map(product => <ProductMobileCard key={product.id} product={product} onEdit={onEdit} onToggleActive={onToggleActive} onDeleteRequest={onDeleteRequest} />)}
          {products.length === 0 && <p className="py-8 text-center text-slate-500">Nenhum produto encontrado</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function ProductTableRow({ product, onEdit, onToggleActive, onDeleteRequest }: ProductActionProps) {
  return (
    <tr className="border-b">
      <td className="py-3">{product.modelName}</td>
      <td className="py-3">{product.teamSlug}</td>
      <td className="py-3">R$ {product.price.toFixed(2).replace(".", ",")}</td>
      <td className="py-3"><span className={product.stockQuantity < 10 ? "text-red-500 font-medium" : ""}>{product.stockQuantity}</span></td>
      <td className="py-3">{product.featured ? <Badge variant="secondary">Destaque</Badge> : <span className="text-sm text-slate-400">-</span>}</td>
      <td className="py-3"><Badge variant={product.active ? "success" : "secondary"}>{product.active ? "Ativo" : "Inativo"}</Badge></td>
      <td className="py-3 text-right"><ProductActions product={product} onEdit={onEdit} onToggleActive={onToggleActive} onDeleteRequest={onDeleteRequest} /></td>
    </tr>
  )
}

function ProductMobileCard({ product, onEdit, onToggleActive, onDeleteRequest }: ProductActionProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{product.modelName}</p>
          <p className="text-xs text-slate-500 mt-0.5">{product.teamSlug}{product.featured ? " - Destaque" : ""}</p>
        </div>
        <Badge variant={product.active ? "success" : "secondary"} className="shrink-0 text-[10px]">{product.active ? "Ativo" : "Inativo"}</Badge>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-4 text-sm"><span>R$ {product.price.toFixed(2).replace(".", ",")}</span><span className={product.stockQuantity < 10 ? "text-red-500 font-medium" : ""}>Est: {product.stockQuantity}</span></div>
        <ProductActions product={product} onEdit={onEdit} onToggleActive={onToggleActive} onDeleteRequest={onDeleteRequest} iconClassName="h-3.5 w-3.5" />
      </div>
    </div>
  )
}

function ProductActions({ product, onEdit, onToggleActive, onDeleteRequest, iconClassName = "h-4 w-4" }: ProductActionProps & { iconClassName?: string }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => onEdit(product)}><Pencil className={iconClassName} /></Button>
      <Button variant="ghost" size="sm" onClick={() => onToggleActive(product)}>{product.active ? <EyeOff className={`${iconClassName} text-slate-400`} /> : <Eye className={`${iconClassName} text-green-500`} />}</Button>
      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => onDeleteRequest(product.id)}><Trash2 className={iconClassName} /></Button>
    </div>
  )
}
