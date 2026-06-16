"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCancel = async () => {
    if (!window.confirm("Tem certeza que deseja cancelar este pedido?")) return

    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/orders/my/${orderId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "X-User-Id": userId } : {}),
        },
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error?.message || "Nao foi possivel cancelar o pedido")
      }

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nao foi possivel cancelar o pedido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="outline" className="text-red-500" onClick={handleCancel} disabled={loading}>
        {loading ? "Cancelando..." : "Cancelar pedido"}
      </Button>
      {error && <p className="max-w-xs text-right text-xs text-red-500">{error}</p>}
    </div>
  )
}
