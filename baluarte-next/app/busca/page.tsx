import { SearchX } from "lucide-react"
import { fetchPublicModels, type Model } from "@/lib/api"
import { ProductCard } from "@/components/product-card"

type DisplayModel = Model & {
  image?: string
  name?: string
  team?: { name?: string }
}

type Props = {
  searchParams: Promise<{ q?: string }>
}

async function searchProducts(query: string) {
  try {
    const res = await fetchPublicModels()
    return res.data.filter((p: Model) =>
      p.modelName?.toLowerCase().includes(query.toLowerCase()) ||
      p.teamSlug?.toLowerCase().includes(query.toLowerCase())
    )
  } catch {
    return []
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q || ""
  
  const products = query ? await searchProducts(query) : []
  const displayProducts = products

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-8 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="eyebrow">Busca</p>
        <h1 className="mb-2 mt-4 text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900">
        {query ? `Resultados para "${query}"` : "Buscar produtos"}
        </h1>
        <p className="text-muted-foreground">
          {displayProducts.length} produto(s) encontrado(s)
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
    </div>
  )
}
