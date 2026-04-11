import Link from "next/link"
import { FolderKanban, Layers3 } from "lucide-react"
import { fetchCategories, type Category } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

async function getCategories() {
  try {
    const res = await fetchCategories()
    return res.data
  } catch {
    return []
  }
}

const fallbackCategories: Category[] = [
  { id: "1", name: "Times Nacionais", slug: "nacionais" },
  { id: "2", name: "Times Estrangeiros", slug: "estrangeiros" },
  { id: "3", name: "Seleções", slug: "selecoes" },
  { id: "4", name: "Treino", slug: "treino" },
]

type DisplayCategory = Category & {
  teamCount?: number
}

const fallbackTeamCounts: Record<string, number> = {
  nacionais: 18,
  estrangeiros: 24,
  selecoes: 12,
  treino: 9,
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories()
  const displayCategories = categories.length > 0 ? categories : fallbackCategories

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar
          </Link>
          <div className="mt-2 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <p className="eyebrow">Admin categorias</p>
            <h1 className="mt-4 text-2xl font-bold">Categorias</h1>
            <p className="text-muted-foreground mt-2">Gerencie as categorias da loja</p>
          </div>
        </div>
        <Button>Nova Categoria</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayCategories.map((category: DisplayCategory) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4f7fb] text-[#0f274d]">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </div>
              <Badge variant="outline">{category.slug}</Badge>
            </CardHeader>
            <CardContent>
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Layers3 className="h-4 w-4 text-[#c3222a]" />
                {category.teamCount ?? fallbackTeamCounts[category.slug] ?? 0} times
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">Editar</Button>
                <Button variant="ghost" size="sm">Ver Times</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
