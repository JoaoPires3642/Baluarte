export const runtime = "edge";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

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
