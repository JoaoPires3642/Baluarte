"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

type PixData = {
  qrCodeBase64: string
  copyPasteCode: string
}

export function PaymentPixPanel({
  total,
  pix,
  loading,
  error,
  orderReference,
  onGeneratePix,
}: {
  total: number
  pix: PixData | null
  loading: boolean
  error: string
  orderReference?: string
  onGeneratePix: () => void
}) {
  const handleCopy = async () => {
    if (!pix?.copyPasteCode) return
    try {
      await navigator.clipboard.writeText(pix.copyPasteCode)
    } catch {
      // noop
    }
  }

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div>
        <h3 className="font-semibold text-slate-900">Pagamento via PIX</h3>
        <p className="text-sm text-slate-600">Total: R$ {total.toFixed(2).replace(".", ",")}</p>
      </div>

      {pix ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="font-bold text-green-700">Pedido Confirmado!</p>
            {orderReference && (
              <p className="mt-1 text-sm text-green-600">Nº do pedido: {orderReference}</p>
            )}
          </div>
          <Image
            src={`data:image/png;base64,${pix.qrCodeBase64}`}
            alt="QR Code PIX"
            width={224}
            height={224}
            unoptimized
            className="mx-auto h-56 w-56 rounded-2xl border border-slate-200 bg-white object-contain p-3"
          />

          <button
            type="button"
            onClick={handleCopy}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left"
          >
            <p className="font-semibold text-slate-900">Copiar codigo PIX</p>
            <p className="mt-2 break-all text-xs text-slate-500">{pix.copyPasteCode}</p>
          </button>
        </div>
      ) : (
        <Button type="button" className="w-full" disabled={loading} onClick={onGeneratePix}>
          {loading ? "Gerando PIX..." : "Gerar PIX"}
        </Button>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
