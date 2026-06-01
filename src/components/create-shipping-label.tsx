"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, PackageCheck, PackagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createShippingLabel } from "@/lib/api"

export function CreateShippingLabel({
  orderId,
  status,
  labelId,
  labelUrl,
}: {
  orderId: string
  status: string
  labelId?: string
  labelUrl?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canCreate = status === "paid" || status === "processing"

  const handleCreate = async () => {
    setLoading(true)
    setError("")
    try {
      await createShippingLabel(orderId)
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
          <Button size="sm" variant="outline" disabled>
            <PackageCheck className="mr-2 h-4 w-4" /> Etiqueta criada
          </Button>
        ) : (
          <Button size="sm" onClick={handleCreate} disabled={!canCreate || loading}>
            <PackagePlus className="mr-2 h-4 w-4" /> {loading ? "Gerando..." : "Gerar etiqueta"}
          </Button>
        )}
      </div>
      {!canCreate && !labelUrl && !labelId && <p className="text-xs text-slate-500">Disponível após pagamento aprovado.</p>}
      {labelId && !labelUrl && <p className="text-xs text-slate-500">Etiqueta criada no carrinho da SuperFrete. Emita pelo painel da SuperFrete.</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
