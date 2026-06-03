import Link from "next/link"
import { fetchTeamsByCategory, fetchModelsByTeam, type Team, type Model } from "@/lib/api"
import { ChevronRight, ShieldCheck, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ProductCard } from "@/components/product-card"

type DisplayModel = Model & { image?: string; name?: string }

async function getData() {
  try {
    const teamsRes = await fetchTeamsByCategory("selecoes")
    const teams = teamsRes.data

    const modelResponses = await Promise.all(
      teams.map((team) => fetchModelsByTeam(team.slug).catch(() => ({ data: [] as Model[] })))
    )

    const models = modelResponses.flatMap((r) => r.data)

    return { teams, models }
  } catch {
    return { teams: [] as Team[], models: [] as Model[] }
  }
}

export default async function SelecoesPage() {
  const { teams, models } = await getData()

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar
      </Link>

      <section className="relative mt-4 overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl shadow-slate-900/10">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/70 to-slate-900/35" />
        <div className="relative px-5 py-8 sm:px-6 sm:py-10 md:px-10 md:py-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#c95f21] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white">
            <Sparkles className="h-4 w-4" /> Seleções
          </span>
          <h1 className="mt-4 text-3xl font-extrabold uppercase tracking-[-0.04em] text-white sm:text-4xl md:text-5xl">Seleções</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
            As melhores seleções nacionais em uma curadoria especial.
          </p>
        </div>
      </section>

      {teams.length > 0 ? (
        <section className="mb-12 mt-8">
          <h2 className="mb-4 text-xl font-semibold">Times</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {teams.map((team) => (
              <Link key={team.id} href={`/times/${team.slug}`}>
                <Card className="cursor-pointer p-4 text-center transition-shadow hover:shadow-lg sm:p-6">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="mx-auto mb-3 h-11 w-11 rounded-full object-contain bg-[#f4f7fb] p-1 sm:h-14 sm:w-14" />
                  ) : (
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4f7fb] text-[#0f274d] sm:h-14 sm:w-14">
                      <ShieldCheck className="h-5 w-5 sm:h-7 sm:w-7" />
                    </div>
                  )}
                  <h3 className="text-sm font-semibold sm:text-base">{team.name}</h3>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-[#c3222a]">
                    Ver produtos <ChevronRight className="h-3.5 w-3.5" />
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-xl font-semibold">Produtos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {models.map((model: DisplayModel) => (
            <ProductCard
              key={model.id}
              href={`/produto/${model.id}?team=${encodeURIComponent(model.teamSlug || "")}`}
              teamLabel={model.teamSlug || "Seleção"}
              title={model.modelName || model.name || "Produto"}
              price={Number(model.price)}
              originalPrice={model.originalPrice ?? null}
              imageUrl={model.thumbnailUrl || model.imageUrl || model.image}
            />
          ))}
        </div>
        {models.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nenhum produto disponível no momento.</p>
        ) : null}
      </section>
    </div>
  )
}
