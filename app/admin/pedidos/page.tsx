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

export default async function AdminOrdersPage() {
  const orders = await getOrders()

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
          {orders.length > 0 && <div className="hidden sm:block overflow-x-auto">
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
                {orders.map((order: Order) => (
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
          </div>}

          {orders.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nenhum pedido registrado ainda.
            </p>
          )}

          <div className="space-y-3 sm:hidden">
            {orders.map((order: Order) => (
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
