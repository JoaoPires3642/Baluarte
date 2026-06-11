export const runtime = "edge";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, MessageCircle } from "lucide-react"

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1"

function getServerApiBaseUrl() {
  return process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
}

function buildWhatsappUrl(whatsapp: string, message: string): string {
  const digits = whatsapp.replace(/\D/g, "")
  if (!digits) return ""
  const base = `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`
  return `${base}?text=${encodeURIComponent(message)}`
}

type SuccessPageProps = {
  searchParams: Promise<{ order?: string; uber?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { order, uber } = await searchParams

  let whatsappUrl = ""
  if (uber === "1") {
    try {
      const res = await fetch(`${getServerApiBaseUrl()}/site/contact-settings`, { next: { revalidate: 60 } })
      const body = await res.json()
      const w = body?.data?.whatsapp
      if (w) {
        const msg = `Ol\u00E1! Fiz a compra pelo site (pedido #${order}) e vou pedir um Uber para retirar. Pode me ajudar?`
        whatsappUrl = buildWhatsappUrl(w, msg)
      }
    } catch {}
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Pedido Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Obrigado pela sua compra. Seu pedido foi recebido e está sendo processado.
          </p>
          {order && (
            <p className="font-medium">
              Número do pedido: <span className="text-primary">{order}</span>
            </p>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp sobre o Uber
            </a>
          )}
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/">
              <Button className="w-full">Continuar Comprando</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
