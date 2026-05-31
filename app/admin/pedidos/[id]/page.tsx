export const runtime = "edge"

import Link from "next/link"
import { ChevronLeft, MapPin, PackageSearch, UserRound } from "lucide-react"
import { fetchOrder, type Order } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UpdateOrderStatus } from "@/components/update-order-status"
import { notFound } from "next/navigation"

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

type Props = {
  params: Promise<{ id: string }>
}

async function getOrder(id: string) {
  try {
    const res = await fetchOrder(id)
    return res.data
  } catch {
    return null
  }
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6 py-8">
      <Link href="/admin/pedidos" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Voltar aos Pedidos
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Pedido</p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">Pedido #{order.orderReference}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusColors[order.status] || "bg-gray-500"}>
            {statusLabels[order.status] || order.status}
          </Badge>
          <UpdateOrderStatus orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2"><PackageSearch className="h-5 w-5 shrink-0 text-[#0f274d]" />Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    Tam: {item.size} • Qtd: {item.quantity}
                  </p>
                </div>
                <p className="font-medium whitespace-nowrap">
                  R$ {(item.unitPrice * item.quantity).toFixed(2).replace(".", ",")}
                </p>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>R$ {order.total.toFixed(2).replace(".", ",")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2"><UserRound className="h-5 w-5 shrink-0 text-[#0f274d]" />Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.shipping?.address && (
              <div>
                <p className="inline-flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4 shrink-0 text-[#c3222a]" />Endereço de Entrega</p>
                <p className="font-medium">{order.shipping.address}</p>
              </div>
            )}
            {!order.shipping?.address && (
              <p className="text-sm text-slate-500">Nenhuma informação de entrega disponível para este pedido.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
