"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type CardTokenResult = {
  token: string
  paymentMethodId: string
  issuerId: string | null
  installments: number
}

export type PaymentCardFormRef = {
  createToken: () => Promise<CardTokenResult | null>
}

type Props = {
  amount: number
  cpf: string
  error: string
}

const MERCADOPAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "APP_USR-37373074-8635-4700-bd4a-bdd82a4f5ba8"

export const PaymentCardForm = forwardRef<PaymentCardFormRef, Props>(function PaymentCardForm({ amount, cpf, error }, ref) {
  const mpRef = useRef<InstanceType<MercadoPago> | null>(null)
  const fieldsMountedRef = useRef(false)
  const [ready, setReady] = useState(() => (
    typeof window !== "undefined" && Boolean(MERCADOPAGO_PUBLIC_KEY && window.MercadoPago)
  ))
  const [sdkError, setSdkError] = useState("")
  const [cardError, setCardError] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("master")

  const publicKey = MERCADOPAGO_PUBLIC_KEY
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

  useEffect(() => {
    if (!ready || !publicKey || fieldsMountedRef.current || !window.MercadoPago) return

    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" })
    mp.fields.create("cardNumber", { placeholder: "0000 0000 0000 0000" }).mount("cardNumber")
    mp.fields.create("expirationDate", { placeholder: "MM/AA" }).mount("cardExpiration")
    mp.fields.create("securityCode", { placeholder: "123" }).mount("cardCvv")
    mpRef.current = mp
    fieldsMountedRef.current = true
  }, [ready, publicKey])

  const createToken = async () => {
    setCardError("")
    if (!ready || !publicKey || configError) return null

    if (!mpRef.current || !fieldsMountedRef.current) {
      setCardError("Meio de pagamento ainda esta carregando")
      return null
    }

    if (!cardholderName.trim()) {
      setCardError("Informe o nome impresso no cartao")
      return null
    }

    if (cpf.replace(/\D/g, "").length !== 11) {
      setCardError("CPF precisa ter 11 digitos")
      return null
    }

    try {
      const tokenBody: Record<string, unknown> = {
        cardholderName: cardholderName.trim(),
        identificationType: "CPF",
        identificationNumber: cpf.replace(/\D/g, ""),
      }
      const tokenData = await mpRef.current.fields.createCardToken(tokenBody)
      const paymentMethodId = extractPaymentMethodId(tokenData) || selectedPaymentMethodId
      if (!paymentMethodId) {
        setCardError("Nao foi possivel identificar a bandeira do cartao")
        return null
      }
      return {
        token: tokenData.id as string,
        paymentMethodId,
        issuerId: (tokenData.issuer_id as string) || null,
        installments: 1,
      }
    } catch (err) {
      setCardError(err instanceof Error ? err.message : "Nao foi possivel validar o cartao")
      return null
    }
  }

  useImperativeHandle(ref, () => ({ createToken }))

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
        <div id="cardNumber" className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
      </div>

      <div className="space-y-2">
        <Label>Bandeira</Label>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={selectedPaymentMethodId}
          onChange={e => setSelectedPaymentMethodId(e.target.value)}
        >
          <option value="master">Mastercard</option>
          <option value="visa">Visa</option>
          <option value="amex">American Express</option>
          <option value="elo">Elo</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Vencimento</Label>
          <div id="cardExpiration" className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
        </div>
        <div className="space-y-2">
          <Label>CVV</Label>
          <div id="cardCvv" className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Total: R$ {amount.toFixed(2).replace(".", ",")}
      </p>

      {(error || cardError || configError) && <p className="text-sm text-red-600">{error || cardError || configError}</p>}

      {!ready && !configError ? <p className="text-sm text-slate-500">Carregando meio de pagamento...</p> : null}
    </div>
  )
})

function extractPaymentMethodId(tokenData: Record<string, unknown>) {
  const paymentMethod = tokenData.payment_method
  const nestedPaymentMethodId = paymentMethod && typeof paymentMethod === "object"
    ? (paymentMethod as Record<string, unknown>).id
    : null
  const bin = tokenData.first_six_digits || tokenData.firstSixDigits || tokenData.bin || tokenData.first_six
  return stringValue(tokenData.payment_method_id)
    || stringValue(tokenData.paymentMethodId)
    || stringValue(nestedPaymentMethodId)
    || detectPaymentMethodId(stringValue(bin))
}

function stringValue(value: unknown) {
  return value == null ? "" : String(value)
}

function detectPaymentMethodId(bin: string) {
  if (!bin && process.env.NODE_ENV !== "production") return "master"
  if (/^4/.test(bin)) return "visa"
  if (/^(5[1-5]|2[2-7])/.test(bin)) return "master"
  if (/^3[47]/.test(bin)) return "amex"
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(bin)) return "elo"
  return ""
}
