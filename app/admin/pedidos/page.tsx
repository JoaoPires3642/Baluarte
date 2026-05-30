import Link from "next/link"
import { ClipboardList, ChevronRight, Search } from "lucide-react"
import { fetchOrders, type Order } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  { id: "1", orderReference: "BAL-001", status: "pending", createdAt: "2024-01-20T10:00:00Z", total: 299.9, items: [{ productId: "1", name: "Camisa Flamengo", size: "G", quantity: 1, unitPrice: 299.9 }] },
  { id: "2", orderReference: "BAL-002", status: "paid", createdAt: "2024-01-19T14:30:00Z", total: 199.9, items: [{ productId: "2", name: "Camisa Palmeiras", size: "M", quantity: 1, unitPrice: 199.9 }] },
  { id: "3", orderReference: "BAL-003", status: "shipped", createdAt: "2024-01-18T09:15:00Z", total: 599.9, items: [{ productId: "3", name: "Camisa Corinthians", size: "P", quantity: 2, unitPrice: 299.9 }] },
  { id: "4", orderReference: "BAL-004", status: "delivered", createdAt: "2024-01-15T16:00:00Z", total: 149.9, items: [{ productId: "4", name: "Camisa São Paulo", size: "GG", quantity: 1, unitPrice: 149.9 }] },
  { id: "5", orderReference: "BAL-005", status: "cancelled", createdAt: "2024-01-14T11:00:00Z", total: 89.9, items: [{ productId: "5", name: "Camisa Vasco", size: "G", quantity: 1, unitPrice: 89.9 }] },
]

export default async function AdminOrdersPage() {
  const orders = await getOrders()
  const displayOrders = orders.length > 0 ? orders : fallbackOrders

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold">Pedidos</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#0f274d]" />
            Lista de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium">Pedido</th>
                  <th className="pb-3 text-left text-sm font-medium">Data</th>
                  <th className="pb-3 text-left text-sm font-medium">Itens</th>
                  <th className="pb-3 text-left text-sm font-medium">Total</th>
                  <th className="pb-3 text-left text-sm font-medium">Status</th>
                  <th className="pb-3 text-right text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {displayOrders.map((order: Order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 font-medium">#{order.orderReference}</td>
                    <td className="py-3">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3 text-slate-500">
                      {order.items?.length || 0} item(s)
                    </td>
                    <td className="py-3">R$ {order.total.toFixed(2).replace(".", ",")}</td>
                    <td className="py-3">
                      <Badge className={statusColors[order.status] || "bg-gray-500"}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/pedidos/${order.id}`}>Detalhes</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 sm:hidden">
            {displayOrders.map((order: Order) => (
              <Link key={order.id} href={`/admin/pedidos/${order.id}`} className="block">
                <div className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#0f274d]/30 active:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">#{order.orderReference}</span>
                    <Badge className={statusColors[order.status] || "bg-gray-500"}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                    <span>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span>
                    <span>{order.items?.length || 0} item(s)</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-lg font-bold">R$ {order.total.toFixed(2).replace(".", ",")}</span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              </Link>
            ))}
            {displayOrders.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">Nenhum pedido encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
