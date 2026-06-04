"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, PackagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminApi } from "@/lib/use-admin-api"

export function CreateShippingLabel({
  orderId,
  status,
  labelId,
  labelUrl,
  trackingCode,
}: {
  orderId: string
  status: string
  labelId?: string
  labelUrl?: string
  trackingCode?: string
}) {
  const router = useRouter()
  const { authedFetch } = useAdminApi()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canCreate = status === "paid" || status === "processing"

  const handleCreate = async () => {
    setLoading(true)
    setError("")
    try {
      await authedFetch(`/orders/${orderId}/shipping-label`, { method: "POST" })
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao gerar etiqueta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {labelUrl ? (
          <Button size="sm" asChild>
            <a href={labelUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Abrir etiqueta
            </a>
          </Button>
        ) : labelId ? (
          <Button size="sm" onClick={handleCreate} disabled={!canCreate || loading}>
            <PackagePlus className="mr-2 h-4 w-4" /> {loading ? "Emitindo..." : "Emitir etiqueta"}
          </Button>
        ) : (
          <Button size="sm" onClick={handleCreate} disabled={!canCreate || loading}>
            <PackagePlus className="mr-2 h-4 w-4" /> {loading ? "Gerando..." : "Gerar etiqueta"}
          </Button>
        )}
        {labelUrl && !trackingCode && (
          <Button size="sm" variant="outline" onClick={handleCreate} disabled={!canCreate || loading}>
            <PackagePlus className="mr-2 h-4 w-4" /> {loading ? "Atualizando..." : "Atualizar rastreio"}
          </Button>
        )}
      </div>
      {!canCreate && !labelUrl && !labelId && <p className="text-xs text-slate-500">Disponível após pagamento aprovado.</p>}
      {labelId && !labelUrl && <p className="text-xs text-slate-500">Etiqueta ja criada na SuperFrete. Clique para emitir e buscar o link de impressao.</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
