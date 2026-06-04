"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PackagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminApi } from "@/lib/use-admin-api"

type BulkShippingLabelResponse = {
  candidates: number
  generated: number
  failures: Array<{ orderId: string; message: string }>
}

export function GeneratePendingShippingLabels() {
  const router = useRouter()
  const { authedFetch } = useAdminApi()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleGenerate = async () => {
    setLoading(true)
    setMessage("")
    setError("")
    try {
      const response = await authedFetch("/orders/shipping-labels/generate-pending", { method: "POST" }) as { data: BulkShippingLabelResponse }
      const failures = response.data.failures?.length || 0
      setMessage(`${response.data.generated} etiqueta(s) gerada(s) de ${response.data.candidates} pendente(s).${failures ? ` ${failures} falharam.` : ""}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar etiquetas pendentes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <Button onClick={handleGenerate} disabled={loading}>
        <PackagePlus className="mr-2 h-4 w-4" />
        {loading ? "Gerando etiquetas..." : "Gerar etiquetas pendentes"}
      </Button>
      {message && <p className="text-xs text-green-600">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
