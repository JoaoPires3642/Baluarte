export const runtime = "edge";
import Link from "next/link"
import { MapPin, PackageSearch, UserRound } from "lucide-react"
import { fetchOrder, type Order } from "@/lib/api"
import { Button } from "@/components/ui/button"
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

const fallbackOrder: Order = {
  id: "1",
  orderReference: "BAL-001",
  status: "processing",
  createdAt: "2024-01-20T10:30:00Z",
  total: 319.8,
  items: [
    { productId: "1", name: "Camisa Flamengo 2024 Home", size: "G", quantity: 1, unitPrice: 299.9 },
  ],
  shipping: {
    address: "Rua Example, 123 - Centro, Rio de Janeiro - RJ",
  },
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getOrder(id) ?? fallbackOrder

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/pedidos" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar aos Pedidos
          </Link>
          <div className="mt-2 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <p className="eyebrow">Pedido</p>
            <h1 className="mt-4 text-2xl font-bold">Pedido #{order.orderReference}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={statusColors[order.status] || "bg-gray-500"}>
            {statusLabels[order.status] || order.status}
          </Badge>
          <Button>Atualizar Status</Button>
        </div>
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
            <CardTitle className="inline-flex items-center gap-2"><UserRound className="h-5 w-5 text-[#0f274d]" />Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">cliente@email.com</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CPF</p>
              <p className="font-medium">***.123.456-**</p>
            </div>
            {order.shipping?.address && (
              <div>
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-[#c3222a]" />Endereço de Entrega</p>
                <p className="font-medium">{order.shipping.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
