export const runtime = "edge";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ShieldCheck } from "lucide-react"

type SuccessPageProps = {
  searchParams: Promise<{ order?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { order } = await searchParams

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
          <div className="rounded-[1.25rem] border border-[#e6edf6] bg-[#f8fbff] p-4 text-sm text-slate-600">
            <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#0f274d]" />Compra registrada com sucesso no fluxo renovado da Baluarte.</p>
          </div>
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
