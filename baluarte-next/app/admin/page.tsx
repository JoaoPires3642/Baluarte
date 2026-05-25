export const runtime = "edge";
import Link from "next/link"
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
    <div className="space-y-8 py-8">
      <div className="rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="eyebrow">Painel</p>
        <h1 className="mt-4 text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-2">Visão geral da sua loja</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Produtos Ativos</p>
            <p className="text-3xl font-bold text-[#0f274d]">{stats.totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Pedidos Hoje</p>
            <p className="text-3xl font-bold text-[#1657a3]">{stats.ordersToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Faturamento</p>
            <p className="text-3xl font-bold text-[#c3222a]">R$ {stats.revenue.toFixed(2).replace(".", ",")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Estoque Baixo</p>
            <p className="text-3xl font-bold text-[#c3222a]">{stats.lowStock}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/produtos">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <CardTitle className="text-lg">Produtos</CardTitle>
              <CardDescription>Gerenciar catálogo</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/pedidos">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <CardTitle className="text-lg">Pedidos</CardTitle>
              <CardDescription>Ver todos os pedidos</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/categorias">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <CardTitle className="text-lg">Categorias</CardTitle>
              <CardDescription>Gerenciar categorias</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Últimos pedidos da sua loja</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/pedidos">Ver Todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                    <td className="py-3">#{order.orderReference}</td>
                    <td className="py-3">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</td>
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
        </CardContent>
      </Card>
    </div>
  )
}
