"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/context/cart-context"

export function OrderSummary({
  shippingCost,
  useStationDelivery,
  loading,
  hasShipping,
  step,
  onSubmit,
}: {
  shippingCost: number
  useStationDelivery: boolean
  loading: boolean
  hasShipping: boolean
  step: number
  onSubmit: () => void
}) {
  const { items, total } = useCart()

  return (
    <>
      {items.map((item) => (
        <div key={`${item.id}-${item.size}`} className="flex items-start justify-between gap-3 text-sm">
          <span className="min-w-0 text-muted-foreground">{item.name} ({item.size}) x{item.quantity}</span>
          <span>R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
        </div>
      ))}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{useStationDelivery ? "Entrega em Estação" : "Frete"}</span>
        <span>R$ {shippingCost.toFixed(2).replace(".", ",")}</span>
      </div>
      <Separator />
      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>R$ {(total + shippingCost).toFixed(2).replace(".", ",")}</span>
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={loading || !hasShipping || step < 3}>
        {loading ? "Processando..." : "Finalizar Pedido"}
      </Button>
    </>
  )
}
