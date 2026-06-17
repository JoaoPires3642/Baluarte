"use client"

import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

type Props = {
  qrCodeBase64?: string
  copyPasteCode?: string
  expiresAt: string
}

export function PixOrderBanner({ qrCodeBase64, copyPasteCode, expiresAt }: Props) {
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState("")

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining("Expirado")
        return
      }
      const min = Math.floor(diff / 60000)
      const sec = Math.floor((diff % 60000) / 1000)
      setRemaining(`${min}:${sec.toString().padStart(2, "0")}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => { clearInterval(id); }
  }, [expiresAt])

  async function handleCopy() {
    if (!copyPasteCode) return
    try {
      await navigator.clipboard.writeText(copyPasteCode)
      setCopied(true)
      setTimeout(() => { setCopied(false); }, 2000)
    } catch {}
  }

  return (
    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-6 text-center space-y-4">
      <p className="font-semibold text-yellow-800">Aguardando Pagamento</p>

      {qrCodeBase64 && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            className="h-48 w-48"
          />
        </div>
      )}

      {copyPasteCode && (
        <div className="space-y-2">
          <p className="text-sm text-yellow-700">Ou pague usando o código PIX:</p>
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <code className="flex-1 truncate rounded-lg bg-yellow-100 px-3 py-2 text-xs text-yellow-900">
              {copyPasteCode}
            </code>
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      <p className={`text-sm font-medium ${remaining === "Expirado" ? "text-red-600" : "text-yellow-700"}`}>
        {remaining === "Expirado" ? "PIX expirado" : `Expira em ${remaining}`}
      </p>
    </div>
  )
}