export const dynamic = "force-dynamic"
export const revalidate = 0

import Link from "next/link"
import { fetchCategories, fetchTeamsByCategory, type Team, type Category } from "@/lib/api"
import { ChevronRight, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"

async function getData() {
  try {
    const catRes = await fetchCategories()
    const categories = catRes.data

    const teamsByCat = await Promise.all(
      categories.map(async (cat) => {
        try {
          const res = await fetchTeamsByCategory(cat.slug)
          return { category: cat, teams: res.data }
        } catch {
          return { category: cat, teams: [] as Team[] }
        }
      })
    )

    return teamsByCat
  } catch {
    return [] as { category: Category; teams: Team[] }[]
  }
}

export default async function TimesPage() {
  const data = await getData()

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar
      </Link>

      <div className="mt-4 mb-8 rounded-[2rem] border border-[#d9e2ef] bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-8">
        <h1 className="text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900 md:text-4xl">Times</h1>
        <p className="mt-2 text-sm text-slate-500">Todos os times organizados por categoria.</p>
      </div>

      {data.map(({ category, teams }) => (
        <section key={category.id} className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">{category.name}</h2>
            <Link
              href={`/categorias/${category.slug}`}
              className="text-xs font-bold uppercase tracking-[0.12em] text-[#c3222a] hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {teams.map((team) => (
              <Link key={team.id} href={`/times/${team.slug}`}>
                <Card className="group cursor-pointer p-4 text-center transition-shadow hover:shadow-lg sm:p-5">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="mx-auto mb-3 h-12 w-12 rounded-full object-contain bg-[#f4f7fb] p-1 sm:h-14 sm:w-14" />
                  ) : (
                    <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f7fb] text-[#0f274d] sm:h-14 sm:w-14">
                      <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                  )}
                  <h3 className="text-sm font-semibold leading-tight sm:text-base">{team.name}</h3>
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c3222a]">
                    Ver <ChevronRight className="h-3 w-3" />
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {teams.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum time disponível nesta categoria.</p>
          ) : null}
        </section>
      ))}
    </div>
  )
}
