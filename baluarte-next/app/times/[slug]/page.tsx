import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Shirt } from "lucide-react"
import { fetchModelsByTeam, type Model } from "@/lib/api"
import { resolveMediaUrl } from "@/lib/media"
import { Card, CardContent } from "@/components/ui/card"

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {models.map((model: DisplayModel) => {
          const mediaUrl = resolveMediaUrl(model.thumbnailUrl || model.imageUrl || model.image)

          return (
          <Link key={model.id} href={`/produto/${model.id}?team=${encodeURIComponent(slug)}`}>
            <Card className="group cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10">
              <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {mediaUrl ? (
                  <Image
                    src={mediaUrl}
                    alt={model.modelName || model.name || "Produto Baluarte"}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <Shirt className="h-12 w-12 text-[#0f274d]" />
                )}
              </div>
              <CardContent className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{teamName}</p>
                <h3 className="mt-2 line-clamp-2 text-base font-bold uppercase tracking-[-0.03em] text-slate-900 sm:text-lg">{model.modelName || model.name}</h3>
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                  {model.originalPrice ? <span className="text-sm text-slate-400 line-through">R$ {Number(model.originalPrice).toFixed(2).replace(".", ",")}</span> : null}
                  <p className="text-xl font-extrabold text-[#102a5c] sm:text-2xl">
                    R$ {Number(model.price).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
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
