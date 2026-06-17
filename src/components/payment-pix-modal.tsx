"use client"

import Image from "next/image"
import { Copy, Check, X, MessageCircle } from "lucide-react"
import { useState } from "react"

type Props = {
  qrCodeBase64: string
  copyPasteCode: string
  total: number
  orderReference: string
  onClose: () => void
  whatsappHref?: string | null
}

export function PaymentPixModal({ qrCodeBase64, copyPasteCode, total, orderReference, onClose, whatsappHref }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyPasteCode)
      setCopied(true)
      setTimeout(() => { setCopied(false); }, 2000)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-w-md w-full rounded-2xl bg-white p-6 shadow-xl space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">Pedido Confirmado!</p>
          <p className="text-sm text-slate-500">Nº {orderReference}</p>
          <p className="mt-1 text-sm text-slate-600">
            Total: R$ {total.toFixed(2).replace(".", ",")}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-center">
          <p className="text-sm font-medium text-yellow-800">
            Pague o PIX em até 10 minutos
          </p>
        </div>

        <div className="flex justify-center">
          <Image
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            width={224}
            height={224}
            unoptimized
            className="h-56 w-56 rounded-2xl border border-slate-200 bg-white object-contain p-3"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-600">Código PIX para copiar e colar:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {copyPasteCode}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Falar no WhatsApp sobre o Uber
          </a>
        )}

        <p className="text-center text-xs text-slate-400">
          Após fechar, acompanhe o pagamento na página do pedido.
        </p>
      </div>
    </div>
  )
}