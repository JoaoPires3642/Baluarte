export const revalidate = 60;

import { SearchX } from "lucide-react"
import Link from "next/link"
import { fetchPublicModelsPage, type Model, type PublicModelsPageMeta } from "@/lib/api"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"

type DisplayModel = Model & {
  image?: string
  name?: string
  team?: { name?: string }
}

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>
}

async function searchProducts(query: string, page: number) {
  try {
    return await fetchPublicModelsPage(page, 10, query)
  } catch {
    return { data: [], meta: { page, size: 10, total: 0, totalPages: 0 } }
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { page: pageParam, q } = await searchParams
  const query = q || ""
  const currentPage = Math.max(Number(pageParam || "1"), 1)
  const pageIndex = currentPage - 1
  const productsResult = await searchProducts(query, pageIndex)
  
  const displayProducts = productsResult.data
  const meta = productsResult.meta

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-8 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="eyebrow">Busca</p>
        <h1 className="mb-2 mt-4 text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900">
        {query ? `Resultados para "${query}"` : "Buscar produtos"}
        </h1>
        <p className="text-muted-foreground">
          {meta.total} produto(s) encontrado(s)
        </p>
      </div>

      {displayProducts.length > 0 ? (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {displayProducts.map((product: DisplayModel) => {
          return (
            <ProductCard
              key={product.id}
              href={`/produto/${product.id}?team=${encodeURIComponent(product.teamSlug || "")}`}
              teamLabel={product.team?.name || product.teamSlug || "Baluarte"}
              title={product.modelName || product.name || "Produto Baluarte"}
              price={Number(product.price)}
              originalPrice={product.originalPrice ?? null}
              imageUrl={product.thumbnailUrl || product.imageUrl || product.image}
            />
        )})}
      </div>
      ) : (
        <div className="surface-card flex min-h-[280px] flex-col items-center justify-center rounded-[2rem] p-8 text-center">
          <SearchX className="h-10 w-10 text-[#c3222a]" />
          <p className="mt-4 text-lg font-bold text-[#10233f]">Nenhum produto encontrado.</p>
          <p className="mt-2 max-w-md text-sm text-slate-500">Tente buscar por nome do time, coleção ou modelo.</p>
        </div>
      )}

      <CatalogPagination meta={meta} query={query} />
    </div>
  )
}

function CatalogPagination({ meta, query }: { meta: PublicModelsPageMeta; query: string }) {
  if (meta.totalPages <= 1) return null
  const currentPage = meta.page + 1
  const previousHref = catalogPageHref(currentPage - 1, query)
  const nextHref = catalogPageHref(currentPage + 1, query)

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button variant="outline" disabled={currentPage <= 1} asChild={currentPage > 1}>
        {currentPage > 1 ? <Link href={previousHref}>Anterior</Link> : <span>Anterior</span>}
      </Button>
      <span className="text-sm font-semibold text-slate-600">Página {currentPage} de {meta.totalPages}</span>
      <Button variant="outline" disabled={currentPage >= meta.totalPages} asChild={currentPage < meta.totalPages}>
        {currentPage < meta.totalPages ? <Link href={nextHref}>Próxima</Link> : <span>Próxima</span>}
      </Button>
    </div>
  )
}

function catalogPageHref(page: number, query: string) {
  const params = new URLSearchParams({ page: String(page) })
  if (query) params.set("q", query)
  return `/busca?${params}`
}
