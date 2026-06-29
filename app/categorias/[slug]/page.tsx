export const dynamic = "force-dynamic"
export const revalidate = 0

import Link from "next/link"
import { ChevronRight, Globe2, ShieldCheck, Shirt, Sparkles, Trophy } from "lucide-react"
import { fetchCategories, fetchModelsByTeam, fetchTeamsByCategory, type Category, type Model, type Team } from "@/lib/api"
import { homeCategoryMap } from "@/lib/home-categories"
import { Card } from "@/components/ui/card"
import { ProductCard } from "@/components/product-card"

type DisplayModel = Model & {
  image?: string
  name?: string
  team?: { name?: string }
}

async function getData(slug: string) {
  try {
    const [categoriesRes, teamsRes] = await Promise.all([
      fetchCategories().catch(() => null),
      fetchTeamsByCategory(slug),
    ])
    const teams = teamsRes.data

    const categoryName = categoriesRes?.data?.find((c: Category) => c.slug === slug)?.name ?? slug

    const modelResponses = await Promise.all(
      teams.map((team) => fetchModelsByTeam(team.slug).catch(() => ({ data: [] as Model[] })))
    )

    const models = modelResponses.flatMap((response) => response.data)

    return { categoryName, teams, models }
  } catch {
    return { categoryName: slug, teams: [], models: [] }
  }
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const { categoryName, teams, models } = await getData(slug)
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
            Navegue por camisas, colecoes e produtos disponiveis nesta categoria.
          </p>
        </div>
      </section>

      <p className="mb-8 mt-6 text-muted-foreground">
        {displayTeams.length} times disponíveis nesta curadoria.
      </p>

      <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Times</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {displayTeams.map((team: Team) => (
              <Link key={team.id} href={`/times/${team.slug}`}>
                <Card className="cursor-pointer p-4 text-center transition-shadow hover:shadow-lg sm:p-6">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="mx-auto mb-3 h-11 w-11 rounded-full object-contain bg-[#f4f7fb] p-1 sm:h-14 sm:w-14" />
                  ) : (
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4f7fb] text-[#0f274d] sm:h-14 sm:w-14"><ShieldCheck className="h-5 w-5 sm:h-7 sm:w-7" /></div>
                  )}
                  <h3 className="text-sm font-semibold sm:text-base">{team.name}</h3>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-[#c3222a]">Ver produtos <ChevronRight className="h-3.5 w-3.5" /></p>
                </Card>
              </Link>
            ))}
        </div>
        {displayTeams.length === 0 ? <p className="text-sm text-slate-500">Nenhum time disponivel para esta categoria.</p> : null}
      </section>

      <section>
          <h2 className="mb-4 text-xl font-semibold">Produtos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {displayModels.map((model: DisplayModel) => {
            return (
            <ProductCard
              key={model.id}
              href={`/produto/${model.id}?team=${encodeURIComponent(model.teamSlug || "")}`}
              teamLabel={model.team?.name || model.teamSlug || "Baluarte"}
              title={model.modelName || model.name || "Produto Baluarte"}
              price={Number(model.price)}
              originalPrice={model.originalPrice ?? null}
              imageUrl={model.thumbnailUrl || model.imageUrl || model.image}
            />
          )})}
        </div>
        {displayModels.length === 0 ? <p className="mt-4 text-sm text-slate-500">Nenhum produto disponivel nesta categoria.</p> : null}
      </section>
    </div>
  )
}
