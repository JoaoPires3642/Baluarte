import Link from "next/link"
import { auth, currentUser } from "@clerk/nextjs/server"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { type AdminProduct, type AdminProductDashboardSummary, type Order } from "@/lib/api"
import { getAdminLowStockVariants, toAdminLowStockReportItems } from "@/lib/admin-low-stock"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AdminLowStockReportButton } from "@/components/admin-low-stock-report-button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  pending_payment: "Aguardando Pagamento",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  paid: "bg-blue-500",
  processing: "bg-purple-500",
  shipped: "bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  pending_payment: "bg-yellow-500",
}

const LOW_STOCK_THRESHOLD = 5

async function getAdminHeaders() {
  const { userId, getToken } = await auth()
  const token = await getToken()
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress

  if (!userId || !token) return null

  return {
    Authorization: `Bearer ${token}`,
    "X-Clerk-User-Id": userId,
    ...(email && { "X-Clerk-Email": email }),
  }
}

async function getOrders(headers: Record<string, string>): Promise<Order[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders?page=0&size=5`, { cache: "no-store", headers })
    if (!res.ok) return []
    const payload = await res.json() as { data: Order[] }
    return payload.data
  } catch {
    return []
  }
}

async function getProductSummary(headers: Record<string, string>): Promise<AdminProductDashboardSummary> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/products/summary?lowStockThreshold=${LOW_STOCK_THRESHOLD}&lowStockLimit=50`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) return { totalActiveProducts: 0, lowStockVariants: [] }
    const payload = await res.json() as { data: AdminProductDashboardSummary }
    return payload.data
  } catch {
    return { totalActiveProducts: 0, lowStockVariants: [] }
  }
}

async function getAdminProducts(headers: Record<string, string>): Promise<AdminProduct[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/products`, { headers, cache: "no-store" })
    if (!res.ok) return []
    const payload = await res.json() as { data: AdminProduct[] }
    return payload.data
  } catch {
    return []
  }
}

function isToday(date: string) {
  const value = new Date(date)
  const today = new Date()
  return value.toDateString() === today.toDateString()
}

export default async function AdminDashboard() {
  const headers = await getAdminHeaders()
  const [orders, productSummary, adminProducts] = headers
    ? await Promise.all([getOrders(headers), getProductSummary(headers), getAdminProducts(headers)])
    : [[], { totalActiveProducts: 0, lowStockVariants: [] }, []]
  const paidOrders = orders.filter(order => isToday(order.createdAt) && order.status !== "cancelled" && order.status !== "pending_payment")

  const lowStockVariants = toAdminLowStockReportItems(getAdminLowStockVariants(adminProducts, LOW_STOCK_THRESHOLD))

  const stats = {
    totalProducts: productSummary.totalActiveProducts,
    ordersToday: paidOrders.length,
    revenue: paidOrders.reduce((sum: number, order: Order) => sum + (order.total || 0), 0),
    lowStock: lowStockVariants.length,
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
        <Link href={lowStockVariants.length > 0 ? "/admin/produtos" : "#"}>
          <Card className={`h-full ${lowStockVariants.length > 0 ? "hover:shadow-lg transition-shadow cursor-pointer" : ""}`}>
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs text-slate-500">Estoque Baixo</p>
              <p className="mt-1 text-2xl font-bold text-[#c3222a]">{stats.lowStock}</p>
            </CardContent>
          </Card>
        </Link>
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

      {lowStockVariants.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <CardTitle className="text-base sm:text-lg">Variantes com Estoque Baixo</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Produtos com variações abaixo de {LOW_STOCK_THRESHOLD} unidades
                </CardDescription>
              </div>
            </div>
            <AdminLowStockReportButton items={lowStockVariants} threshold={LOW_STOCK_THRESHOLD} />
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left text-sm font-medium">Produto</th>
                    <th className="pb-3 text-left text-sm font-medium">Tamanho</th>
                    <th className="pb-3 text-right text-sm font-medium">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockVariants.map((item) => (
                    <tr key={`${item.productId}-${item.size}`} className="border-b">
                      <td className="py-3 font-medium">
                        <Link href={`/admin/produtos?editId=${item.productId}`} className="hover:underline">
                          {item.productName}
                        </Link>
                      </td>
                      <td className="py-3">{item.size}</td>
                      <td className="py-3 text-right font-semibold text-red-600">{item.stockQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
          {orders.length > 0 && <div className="hidden sm:block overflow-x-auto">
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
                {orders.slice(0, 5).map((order: Order) => (
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
          </div>}

          {orders.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nenhum pedido registrado ainda.
            </p>
          )}

          <div className="space-y-2 sm:hidden">
            {orders.slice(0, 5).map((order: Order) => (
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
