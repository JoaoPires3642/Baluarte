import Link from "next/link"
import { AlertTriangle, ChevronLeft, MapPin, PackageSearch, Truck, UserRound } from "lucide-react"
import { type Order } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UpdateOrderStatus } from "@/components/update-order-status"
import { CreateShippingLabel } from "@/components/create-shipping-label"
import { notFound } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"

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

type Props = {
  params: Promise<{ id: string }>
}

async function getOrder(id: string) {
  try {
    const { userId, getToken } = await auth()
    const user = await currentUser()
    const token = await getToken()
    const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Clerk-User-Id": userId || "",
        "X-Clerk-Email": user?.emailAddresses?.[0]?.emailAddress || "",
      },
    })
    if (!res.ok) return null
    const payload = await res.json() as { data: Order }
    return payload.data
  } catch {
    return null
  }
}

function isStaleProcessingOrder(order: Order) {
  if (order.status !== "processing" || !order.shipping?.labelId) return false
  const updatedAt = order.updatedAt || order.createdAt
  const updatedTime = new Date(updatedAt).getTime()
  if (Number.isNaN(updatedTime)) return false
  return Date.now() - updatedTime > 24 * 60 * 60 * 1000
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  const staleProcessing = isStaleProcessingOrder(order)

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

      {staleProcessing && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Etiqueta gerada há mais de 1 dia e pedido ainda está em processamento.</p>
            <p className="mt-1 text-amber-800">Verifique se a etiqueta foi impressa/postada ou se o pedido ficou esquecido.</p>
          </div>
        </div>
      )}

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

        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2"><Truck className="h-5 w-5 shrink-0 text-[#0f274d]" />Frete e Etiqueta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1 text-sm">
              <p><span className="text-slate-500">Serviço:</span> {order.shipping?.serviceName || order.shipping?.serviceId || "Nao informado"}</p>
              <p><span className="text-slate-500">Etiqueta:</span> {order.shipping?.labelId || "Nao gerada"}</p>
              <p><span className="text-slate-500">Rastreio:</span> {order.shipping?.trackingCode || "Nao disponivel"}</p>
            </div>
            <CreateShippingLabel
              orderId={order.id}
              status={order.status}
              labelId={order.shipping?.labelId}
              labelUrl={order.shipping?.labelUrl}
              trackingCode={order.shipping?.trackingCode}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
