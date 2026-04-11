import Link from "next/link"
import Image from "next/image"
import { SearchX, Shirt } from "lucide-react"
import { fetchPublicModels, type Model } from "@/lib/api"
import { resolveMediaUrl } from "@/lib/media"
import { Card, CardContent } from "@/components/ui/card"

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayProducts.map((product: DisplayModel) => {
          const mediaUrl = resolveMediaUrl(product.thumbnailUrl || product.imageUrl || product.image)

          return (
          <Link key={product.id} href={`/produto/${product.id}?team=${encodeURIComponent(product.teamSlug || "")}`}>
            <Card className="group cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10">
              <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {mediaUrl ? (
                    <Image
                      src={mediaUrl}
                      alt={product.modelName || product.name || "Produto Baluarte"}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                  <Shirt className="h-12 w-12 text-[#0f274d]" />
                )}
              </div>
              <CardContent className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{product.team?.name || product.teamSlug}</p>
                <h3 className="line-clamp-2 font-[family-name:var(--font-heading)] text-base font-bold uppercase tracking-[-0.03em] text-slate-900 sm:text-lg">{product.modelName || product.name}</h3>
                <p className="mt-3 border-t border-slate-100 pt-3 text-xl font-extrabold text-[#102a5c] sm:text-2xl">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </p>
              </CardContent>
            </Card>
          </Link>
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
