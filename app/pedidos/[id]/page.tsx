export const runtime = "edge";

import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin, PackageSearch } from "lucide-react"
import { fetchOrder } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/pedidos" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar aos Pedidos
      </Link>

      <div className="flex items-center justify-between mt-4 mb-8">
        <div className="rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <p className="eyebrow">Pedido</p>
          <h1 className="mt-4 text-2xl font-bold">Pedido #{order.orderReference}</h1>
          <p className="text-muted-foreground">
            Realizado em {new Date(order.createdAt).toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Badge className={statusColors[order.status] || "bg-gray-500"}>
          {statusLabels[order.status] || order.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2"><PackageSearch className="h-5 w-5 text-[#0f274d]" />Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Tamanho: {item.size} • Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">
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
            <CardTitle>Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.shipping?.address && (
              <div>
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-[#c3222a]" />Endereço</p>
                <p className="font-medium">{order.shipping.address}</p>
              </div>
            )}
            {order.shipping?.trackingCode && (
              <div>
                <p className="text-sm text-muted-foreground">Código de Rastreamento</p>
                <p className="font-medium">{order.shipping.trackingCode}</p>
              </div>
            )}
            {!order.shipping && (
              <p className="text-muted-foreground">Dados de entrega não disponíveis</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
