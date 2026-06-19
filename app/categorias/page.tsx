export const dynamic = "force-dynamic"
export const revalidate = 0

import Link from "next/link"
import { fetchCategories, type Category } from "@/lib/api"
import { Globe2, ShieldCheck, Sparkles, Shirt, Trophy, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { homeCategoryMap } from "@/lib/home-categories"

const categoryIcons: Record<string, typeof Trophy> = {
  nacionais: Trophy,
  internacionais: Globe2,
  estrangeiros: Globe2,
  selecoes: Sparkles,
  personalizado: Shirt,
  treino: Shirt,
}

async function getData() {
  try {
    const res = await fetchCategories()
    return res.data
  } catch {
    return [] as Category[]
  }
}

export default async function CategoriasPage() {
  const categories = await getData()

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar
      </Link>

      <div className="mt-4 mb-8 rounded-[2rem] border border-[#d9e2ef] bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-8">
        <h1 className="text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900 md:text-4xl">Categorias</h1>
        <p className="mt-2 text-sm text-slate-500">Explore todas as categorias disponíveis.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat.slug] || ShieldCheck
          const hero = homeCategoryMap[cat.slug]
          return (
            <Link key={cat.id} href={`/categorias/${cat.slug}`}>
              <Card className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg">
                {hero ? (
                  <div className="relative h-32 overflow-hidden sm:h-40">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url('${hero.image}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
                        style={{ backgroundColor: hero.color }}
                      >
                        <Icon className="h-3 w-3" /> {hero.name}
                      </span>
                    </div>
                  </div>
                ) : null}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{cat.name}</h3>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma categoria disponível no momento.</p>
      ) : null}
    </div>
  )
}
