"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

type CardTokenResult = {
  token: string
  paymentMethodId: string
  issuerId: string | null
  installments: number
}

type Props = {
  amount: number
  cpf: string
  loading: boolean
  error: string
  onToken: (result: CardTokenResult) => void
}

export function PaymentCardForm({ amount, cpf, loading, error, onToken }: Props) {
  const [ready, setReady] = useState(() => (
    typeof window !== "undefined" && Boolean(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY && window.MercadoPago)
  ))
  const [sdkError, setSdkError] = useState("")
  const [cardholderName, setCardholderName] = useState("")

  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
  const configError = !publicKey ? "Chave pública do Mercado Pago não configurada" : sdkError

  useEffect(() => {
    if (!publicKey) {
      return
    }
    if (window.MercadoPago) {
      queueMicrotask(() => setReady(true))
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://sdk.mercadopago.com/js/v2"]')
    if (existingScript) {
      existingScript.addEventListener("load", () => setReady(true), { once: true })
      existingScript.addEventListener("error", () => setSdkError("Não foi possível carregar o Mercado Pago"), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.onload = () => setReady(true)
    script.onerror = () => setSdkError("Não foi possível carregar o Mercado Pago")
    document.head.appendChild(script)
  }, [publicKey])

  const handleSubmit = async () => {
    if (!ready || !publicKey) return

    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" })

    const cardNumber = (document.getElementById("cardNumber") as HTMLInputElement)?.value?.replace(/\s/g, "")
    const expDate = (document.getElementById("cardExpiration") as HTMLInputElement)?.value?.split("/")
    const cvv = (document.getElementById("cardCvv") as HTMLInputElement)?.value

    if (!cardNumber || !expDate || expDate.length !== 2 || !cvv || !cardholderName) return

    try {
      const tokenBody: Record<string, unknown> = {
        cardNumber,
        securityCode: cvv,
        expirationMonth: expDate[0].trim(),
        expirationYear: expDate[1].trim(),
        cardholderName,
      }
      if (cpf) {
        tokenBody.identificationType = "CPF"
        tokenBody.identificationNumber = cpf.replace(/\D/g, "")
      }
      const tokenData = await mp.fields.createCardToken(tokenBody)
      onToken({
        token: tokenData.id as string,
        paymentMethodId: (tokenData.payment_method_id as string) || "",
        issuerId: (tokenData.issuer_id as string) || null,
        installments: 1,
      })
    } catch {
      // parent handles error
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900">Cartão de crédito</h3>

      <div className="space-y-2">
        <Label>Nome no cartão</Label>
        <Input
          placeholder="Nome impresso no cartão"
          value={cardholderName}
          onChange={e => setCardholderName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Número do cartão</Label>
        <Input id="cardNumber" placeholder="0000 0000 0000 0000" maxLength={19} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Vencimento</Label>
          <Input id="cardExpiration" placeholder="MM/AA" maxLength={5} />
        </div>
        <div className="space-y-2">
          <Label>CVV</Label>
          <Input id="cardCvv" placeholder="123" maxLength={4} />
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Total: R$ {amount.toFixed(2).replace(".", ",")}
      </p>

      {(error || configError) && <p className="text-sm text-red-600">{error || configError}</p>}

      <Button
        type="button"
        className="w-full"
        disabled={loading || !ready || !cardholderName || Boolean(configError)}
        onClick={handleSubmit}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {!ready ? "Carregando meio de pagamento..." : "Pagar com cartão"}
      </Button>
    </div>
  )
}
