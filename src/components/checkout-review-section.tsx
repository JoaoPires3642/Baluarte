"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatDateBr } from "@/lib/checkout-utils"
import { deliveryDayLabels } from "@/lib/api"
import { useCart } from "@/context/cart-context"
export function ReviewSection({
  useStationDelivery,
  stationRecipientName,
  selectedDeliveryDay,
  selectedDeliveryDate,
  selectedStation,
  selectedTimeSlot,
  onBack,
  onConfirm,
}: {
  useStationDelivery: boolean
  stationRecipientName: string
  selectedDeliveryDay: string
  selectedDeliveryDate: string
  selectedStation: string
  selectedTimeSlot: string
  onBack: () => void
  onConfirm: () => void
}) {
  const { items } = useCart()

  return (
    <>
      {items.map((item) => (
        <div key={`${item.id}-${item.size}`} className="flex items-start justify-between gap-3 text-sm">
          <span className="min-w-0 text-muted-foreground">{item.quantity}x {item.name} ({item.size})</span>
          <span>R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
        </div>
      ))}
      <Separator />
      {useStationDelivery ? (
        <div className="text-sm text-slate-600">
          <p className="font-semibold">Entrega em Estação</p>
          <p>{stationRecipientName}</p>
          <p>{deliveryDayLabels[selectedDeliveryDay as keyof typeof deliveryDayLabels] || selectedDeliveryDay} - {formatDateBr(selectedDeliveryDate)}</p>
          <p>Estação {selectedStation}</p>
          <p>Horário: {selectedTimeSlot}</p>
        </div>
      ) : null}
      <div className="flex justify-between sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">Voltar</Button>
        <Button onClick={onConfirm} className="w-full sm:w-auto">Confirmar e pagar</Button>
      </div>
    </>
  )
}
