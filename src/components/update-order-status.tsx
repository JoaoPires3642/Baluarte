"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAdminApi } from "@/lib/use-admin-api"

const STATUS_ORDER = ["pending", "paid", "processing", "shipped", "delivered"]

export function UpdateOrderStatus({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter()
  const { authedFetch } = useAdminApi()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null

  const handleAdvance = async (status: string) => {
    setLoading(true)
    setError("")
    try {
      await authedFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStatus && (
        <Button size="sm" onClick={() => handleAdvance(nextStatus)} disabled={loading}>
          Avançar para {STATUS_ORDER.indexOf(nextStatus) >= 3 ? "Enviado" : nextStatus === "paid" ? "Pago" : nextStatus === "processing" ? "Processando" : nextStatus}
        </Button>
      )}
      {currentStatus !== "cancelled" && (
        <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleAdvance("cancelled")} disabled={loading}>
          Cancelar
        </Button>
      )}
      {error && <p className="w-full text-xs text-red-500">{error}</p>}
    </div>
  )
}
