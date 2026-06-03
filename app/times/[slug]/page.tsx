export const revalidate = 60;

import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { fetchModelsByTeam, type Model } from "@/lib/api"
import { ProductCard } from "@/components/product-card"

type DisplayModel = Model & {
  image?: string
  name?: string
}

type Props = {
  params: Promise<{ slug: string }>
}

async function getData(slug: string) {
  try {
    const modelsRes = await fetchModelsByTeam(slug)
    return { models: modelsRes.data }
  } catch {
    return { models: [] }
  }
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params
  const { models } = await getData(slug)

  const teamName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Link href="/categorias/nacionais" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar
      </Link>

      <div className="mt-4 mb-8 rounded-[2rem] border border-[#d9e2ef] bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="eyebrow">Time</p>
        <h1 className="mt-4 text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900 md:text-4xl">{teamName}</h1>
        <p className="mt-2 text-sm text-slate-500">Produtos organizados em uma vitrine mais limpa e confiável.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {models.map((model: DisplayModel) => {
          return (
            <ProductCard
              key={model.id}
              href={`/produto/${model.id}?team=${encodeURIComponent(slug)}`}
              teamLabel={teamName}
              title={model.modelName || model.name || "Produto Baluarte"}
              price={Number(model.price)}
              originalPrice={model.originalPrice ?? null}
              imageUrl={model.thumbnailUrl || model.imageUrl || model.image}
            />
        )})}
      </div>

      {models.length === 0 ? (
        <div className="surface-card mt-6 rounded-[2rem] p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-[#c3222a]" />
          <p className="mt-4 text-sm text-slate-500">Nenhum modelo disponível para este time no momento.</p>
        </div>
      ) : null}
    </div>
  )
}
