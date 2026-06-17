import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

type Order = {
  id: string
  orderReference: string
  status: string
  createdAt: string
  total: number
  items: Array<{ productId: string; name: string; size: string; quantity: number; unitPrice: number }>
}

async function getOrders(): Promise<Order[]> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return []

    const res = await fetch(`${API_BASE_URL}/orders/my`, {
      headers: { "X-User-Id": session.user.id, "X-User-Email": session.user.email ?? "" },
      cache: "no-store",
    })
    if (!res.ok) return []
    const payload = await res.json() as { data: Order[] }
    return payload.data
  } catch {
    return []
  }
}

export default async function OrdersPage() {
  const orders = await getOrders()
  const displayOrders = orders

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="eyebrow">Minha conta</p>
        <h1 className="mt-4 text-2xl font-bold">Meus Pedidos</h1>
      </div>

      {displayOrders.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="text-muted-foreground mb-4">Você ainda não tem pedidos</p>
              <Link href="/">
              <Button>Começar a Comprar</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayOrders.map((order: Order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Pedido #{order.orderReference}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Badge className={statusColors[order.status] || "bg-gray-500"}>
                  {statusLabels[order.status] || order.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={`${item.name}-${item.size}`} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} ({item.size}) x{item.quantity}
                      </span>
                      <span>R$ {(item.unitPrice * item.quantity).toFixed(2).replace(".", ",")}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-semibold mt-4 pt-4 border-t">
                  <span>Total</span>
                  <span>R$ {order.total.toFixed(2).replace(".", ",")}</span>
                </div>
                <Link href={`/pedidos/${order.id}`}>
                  <Button variant="outline" size="sm" className="mt-4">
                    Ver Detalhes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
