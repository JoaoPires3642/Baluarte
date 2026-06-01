"use client"

import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
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

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ")
}

function formatExpiration(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function normalizeExpirationYear(year: string) {
  return year.length === 2 ? `20${year}` : year
}

export const PaymentCardForm = forwardRef<PaymentCardFormRef, Props>(function PaymentCardForm({ amount, cpf, error }, ref) {
  const [ready, setReady] = useState(() => (
    typeof window !== "undefined" && Boolean(MERCADOPAGO_PUBLIC_KEY && window.MercadoPago)
  ))
  const [sdkError, setSdkError] = useState("")
  const [cardError, setCardError] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiration, setExpiration] = useState("")
  const [cvv, setCvv] = useState("")

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

  const createToken = async () => {
    setCardError("")
    if (!ready || !publicKey || configError) return null

    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" })

    const normalizedCardNumber = cardNumber.replace(/\D/g, "")
    const expDate = expiration.split("/")
    const normalizedCvv = cvv.replace(/\D/g, "")

    if (normalizedCardNumber.length < 13 || expDate.length !== 2 || expDate[0].length !== 2 || expDate[1].length !== 2 || !normalizedCvv || !cardholderName.trim()) {
      setCardError("Confira numero, vencimento, CVV e nome do cartao")
      return null
    }

    try {
      const tokenBody: Record<string, unknown> = {
        cardNumber: normalizedCardNumber,
        securityCode: normalizedCvv,
        expirationMonth: expDate[0].trim(),
        expirationYear: normalizeExpirationYear(expDate[1].trim()),
        cardholderName: cardholderName.trim(),
      }
      if (cpf) {
        tokenBody.identificationType = "CPF"
        tokenBody.identificationNumber = cpf.replace(/\D/g, "")
      }
      const tokenData = await mp.fields.createCardToken(tokenBody)
      const paymentMethodId = (tokenData.payment_method_id as string) || detectPaymentMethodId(normalizedCardNumber)
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
        <Input
          id="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          value={cardNumber}
          onChange={e => setCardNumber(formatCardNumber(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Vencimento</Label>
          <Input
            id="cardExpiration"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            maxLength={5}
            value={expiration}
            onChange={e => setExpiration(formatExpiration(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>CVV</Label>
          <Input
            id="cardCvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={4}
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
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

function detectPaymentMethodId(cardNumber: string) {
  if (/^4/.test(cardNumber)) return "visa"
  if (/^(5[1-5]|2[2-7])/.test(cardNumber)) return "master"
  if (/^3[47]/.test(cardNumber)) return "amex"
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(cardNumber)) return "elo"
  return ""
}
