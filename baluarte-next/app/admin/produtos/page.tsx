export const runtime = "edge";
import Link from "next/link"
import { PackagePlus, Search } from "lucide-react"
import { fetchPublicModels, type Model } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type AdminDisplayProduct = Model & {
  name?: string
  team?: { name: string }
  stock: number
  active: boolean
}

const fallbackProducts: AdminDisplayProduct[] = [
  { id: "1", teamSlug: "flamengo", modelName: "Camisa Flamengo 2024 Home", team: { name: "Flamengo" }, price: 299.9, stock: 45, active: true },
  { id: "2", teamSlug: "palmeiras", modelName: "Camisa Palmeiras 2024 Away", team: { name: "Palmeiras" }, price: 289.9, stock: 12, active: true },
  { id: "3", teamSlug: "corinthians", modelName: "Camisa Corinthians 2024 III", team: { name: "Corinthians" }, price: 279.9, stock: 0, active: true },
]

async function getProducts(): Promise<AdminDisplayProduct[]> {
  try {
    const res = await fetchPublicModels()
    return res.data.map((p: Model) => ({
      ...p,
      team: { name: p.teamSlug },
      stock: p.stockQuantity ?? 0,
      active: true,
    }))
  } catch {
    return fallbackProducts
  }
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar
          </Link>
          <div className="mt-2 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <p className="eyebrow">Admin produtos</p>
            <h1 className="mt-4 text-2xl font-bold">Produtos</h1>
            <p className="text-muted-foreground mt-2">Gerencie seu catálogo</p>
          </div>
        </div>
        <Button className="inline-flex items-center gap-2"><PackagePlus className="h-4 w-4" />Novo Produto</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Buscar produto..." className="max-w-sm pl-10" />
            </div>
            <Button variant="outline">Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium">Produto</th>
                  <th className="pb-3 text-left text-sm font-medium">Time</th>
                  <th className="pb-3 text-left text-sm font-medium">Preço</th>
                  <th className="pb-3 text-left text-sm font-medium">Estoque</th>
                  <th className="pb-3 text-left text-sm font-medium">Status</th>
                  <th className="pb-3 text-right text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: AdminDisplayProduct) => (
                  <tr key={product.id} className="border-b">
                    <td className="py-3">{product.modelName || product.name}</td>
                    <td className="py-3">{product.team?.name || "-"}</td>
                    <td className="py-3">R$ {product.price.toFixed(2).replace(".", ",")}</td>
                    <td className="py-3">
                      <span className={product.stock < 10 ? "text-red-500 font-medium" : ""}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm">Editar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
