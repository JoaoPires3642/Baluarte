import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Globe2, ShieldCheck, Shirt, Sparkles, Trophy } from "lucide-react"
import { fetchTeamsByCategory, fetchPublicModels, type Model, type Team } from "@/lib/api"
import { homeCategoryMap } from "@/lib/home-categories"
import { resolveMediaUrl } from "@/lib/media"
import { Card, CardContent } from "@/components/ui/card"

type DisplayModel = Model & {
  image?: string
  name?: string
  team?: { name?: string }
}

const categoryNames: Record<string, string> = {
  nacionais: "Nacionais",
  internacionais: "Internacionais",
  estrangeiros: "Internacionais",
  selecoes: "Selecoes",
  personalizado: "Personalizado",
  treino: "Personalizado",
}

async function getData(slug: string) {
  try {
    const [teamsRes, modelsRes] = await Promise.all([
      fetchTeamsByCategory(slug),
      fetchPublicModels(),
    ])
    return { teams: teamsRes.data, models: modelsRes.data }
  } catch {
    return { teams: [], models: [] }
  }
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const { teams, models } = await getData(slug)

  const categoryName = categoryNames[slug] || slug
  const categoryHero = homeCategoryMap[slug] || homeCategoryMap[slug === "estrangeiros" ? "internacionais" : slug === "treino" ? "personalizado" : ""]
  const categoryIcons: Record<string, typeof Trophy> = {
    nacionais: Trophy,
    internacionais: Globe2,
    estrangeiros: Globe2,
    selecoes: Sparkles,
    personalizado: Shirt,
    treino: Shirt,
  }
  const CategoryIcon = categoryIcons[slug] || ShieldCheck

  const displayTeams = teams
  const displayModels = models.slice(0, 8)

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar
      </Link>

      <section className="relative mt-4 overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl shadow-slate-900/10">
        {categoryHero ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${categoryHero.image}')` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/70 to-slate-900/35" />
        <div className="relative px-5 py-8 sm:px-6 sm:py-10 md:px-10 md:py-14">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white"
            style={{ backgroundColor: categoryHero?.color || "#1e3a8a" }}
          >
            <CategoryIcon className="h-4 w-4" /> Categoria
          </span>
          <h1 className="mt-4 text-3xl font-extrabold uppercase tracking-[-0.04em] text-white sm:text-4xl md:text-5xl">{categoryName}</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
            Explore a mesma linguagem visual do app, com destaque para colecoes, times e produtos desta categoria.
          </p>
        </div>
      </section>

      <p className="mb-8 mt-6 text-muted-foreground">
        {displayTeams.length} times disponíveis nesta curadoria.
      </p>

      <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Times</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayTeams.map((team: Team) => (
              <Link key={team.id} href={`/times/${team.slug}`}>
                <Card className="cursor-pointer p-5 text-center transition-shadow hover:shadow-lg sm:p-6">
                  <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f7fb] text-[#0f274d]"><ShieldCheck className="h-7 w-7" /></div>
                  <h3 className="font-semibold">{team.name}</h3>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-[#c3222a]">Ver produtos <ChevronRight className="h-3.5 w-3.5" /></p>
                </Card>
              </Link>
            ))}
        </div>
        {displayTeams.length === 0 ? <p className="text-sm text-slate-500">Nenhum time disponivel para esta categoria.</p> : null}
      </section>

      <section>
          <h2 className="mb-4 text-xl font-semibold">Produtos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayModels.map((model: DisplayModel) => {
            const mediaUrl = resolveMediaUrl(model.thumbnailUrl || model.imageUrl || model.image)

            return (
            <Link key={model.id} href={`/produto/${model.id}?team=${encodeURIComponent(model.teamSlug || "")}`}>
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
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{model.team?.name || model.teamSlug}</p>
                  <h3 className="line-clamp-2 text-base font-bold uppercase tracking-[-0.03em] text-slate-900 sm:text-lg">{model.modelName || model.name}</h3>
                  <p className="mt-3 border-t border-slate-100 pt-3 text-xl font-extrabold text-[#102a5c] sm:text-2xl">
                    R$ {model.price.toFixed(2).replace(".", ",")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )})}
        </div>
        {displayModels.length === 0 ? <p className="mt-4 text-sm text-slate-500">Nenhum produto disponivel nesta categoria.</p> : null}
      </section>
    </div>
  )
}
