import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { fetchOrders, type Order } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  paid: "bg-blue-500",
  processing: "bg-purple-500",
  shipped: "bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
}

async function getOrders() {
  try {
    const res = await fetchOrders()
    return res.data
  } catch {
    return []
  }
}

const fallbackOrders: Order[] = [
  { id: "1", orderReference: "BAL-001", status: "pending", createdAt: "2024-01-20", total: 299.9, items: [] },
  { id: "2", orderReference: "BAL-002", status: "paid", createdAt: "2024-01-19", total: 199.9, items: [] },
  { id: "3", orderReference: "BAL-003", status: "shipped", createdAt: "2024-01-18", total: 599.9, items: [] },
]

export default async function AdminDashboard() {
  const orders = await getOrders()
  const displayOrders = orders.length > 0 ? orders : fallbackOrders

  const stats = {
    totalProducts: 156,
    ordersToday: displayOrders.length,
    revenue: displayOrders.reduce((sum: number, order: Order) => sum + (order.total || 0), 0),
    lowStock: 8,
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <p className="eyebrow">Painel</p>
        <h1 className="mt-1 text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs text-slate-500">Produtos Ativos</p>
            <p className="mt-1 text-2xl font-bold text-[#0f274d]">{stats.totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs text-slate-500">Pedidos Hoje</p>
            <p className="mt-1 text-2xl font-bold text-[#1657a3]">{stats.ordersToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs text-slate-500">Faturamento</p>
            <p className="mt-1 text-2xl font-bold text-[#c3222a]">R$ {stats.revenue.toFixed(2).replace(".", ",")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs text-slate-500">Estoque Baixo</p>
            <p className="mt-1 text-2xl font-bold text-[#c3222a]">{stats.lowStock}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/admin/produtos">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <CardTitle className="text-base sm:text-lg">Produtos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gerenciar catálogo</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/pedidos">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <CardTitle className="text-base sm:text-lg">Pedidos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Ver todos os pedidos</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/categorias">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <CardTitle className="text-base sm:text-lg">Categorias</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gerenciar categorias</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">Pedidos Recentes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Últimos pedidos da sua loja</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/pedidos">Ver Todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium">Pedido</th>
                  <th className="pb-3 text-left text-sm font-medium">Data</th>
                  <th className="pb-3 text-left text-sm font-medium">Total</th>
                  <th className="pb-3 text-left text-sm font-medium">Status</th>
                  <th className="pb-3 text-right text-sm font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {displayOrders.slice(0, 5).map((order: Order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 font-medium">#{order.orderReference}</td>
                    <td className="py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3">R$ {order.total.toFixed(2).replace(".", ",")}</td>
                    <td className="py-3">
                      <Badge className={statusColors[order.status] || "bg-gray-500"}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/pedidos/${order.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 sm:hidden">
            {displayOrders.slice(0, 5).map((order: Order) => (
              <Link key={order.id} href={`/admin/pedidos/${order.id}`} className="block">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 transition-colors hover:border-[#0f274d]/30 active:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">#{order.orderReference}</span>
                      <Badge className={statusColors[order.status] || "bg-gray-500"}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")} • R$ {order.total.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
