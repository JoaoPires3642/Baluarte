"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isValidCpf } from "@/lib/cpf"

type CardTokenResult = {
  token: string
  paymentMethodId: string
  issuerId: string | null
  installments: number
}

type InstallmentOption = {
  installments: number
  installmentAmount: number
  totalAmount: number
  message: string
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
const INSTALLMENTS_LOAD_ERROR = "Nao foi possivel carregar as parcelas deste cartao"

export const PaymentCardForm = forwardRef<PaymentCardFormRef, Props>(function PaymentCardForm({ amount, cpf, error }, ref) {
  const mpRef = useRef<InstanceType<MercadoPago> | null>(null)
  const fieldsMountedRef = useRef(false)
  const lastBinRef = useRef("")
  const [ready, setReady] = useState(() => (
    typeof window !== "undefined" && Boolean(MERCADOPAGO_PUBLIC_KEY && window.MercadoPago)
  ))
  const [sdkError, setSdkError] = useState("")
  const [cardError, setCardError] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [installmentsLoading, setInstallmentsLoading] = useState(false)
  const [selectedInstallments, setSelectedInstallments] = useState(1)
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([])

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
    const cardNumber = mp.fields.create("cardNumber", { placeholder: "0000 0000 0000 0000" })
    cardNumber.mount("cardNumber")
    cardNumber.on?.("binChange", (data) => {
      const bin = typeof data === "string" ? data : data.bin
      lastBinRef.current = bin || ""
      void loadInstallments(mp, amount, bin || "")
    })
    mp.fields.create("expirationDate", { placeholder: "MM/AA" }).mount("cardExpiration")
    mp.fields.create("securityCode", { placeholder: "123" }).mount("cardCvv")
    mpRef.current = mp
    fieldsMountedRef.current = true
  }, [ready, publicKey, amount])

  useEffect(() => {
    if (!mpRef.current || !lastBinRef.current) return
    void loadInstallments(mpRef.current, amount, lastBinRef.current)
  }, [amount])

  const loadInstallments = async (mp: InstanceType<MercadoPago>, paymentAmount: number, bin: string) => {
    if (bin.length < 6 || paymentAmount <= 0) {
      setInstallmentOptions([])
      setSelectedInstallments(1)
      return
    }

    setInstallmentsLoading(true)
    try {
      const response = await mp.getInstallments({
        amount: paymentAmount.toFixed(2),
        bin,
        paymentTypeId: "credit_card",
      })
      const payerCosts = response[0]?.payer_costs || []
      const options = payerCosts.map((cost) => ({
        installments: cost.installments,
        installmentAmount: cost.installment_amount,
        totalAmount: cost.total_amount,
        message: cost.recommended_message || formatInstallmentMessage(cost.installments, cost.installment_amount, cost.total_amount, paymentAmount),
      }))
      setInstallmentOptions(options)
      setSelectedInstallments(options[0]?.installments || 1)
      setCardError(prev => prev === INSTALLMENTS_LOAD_ERROR ? "" : prev)
    } catch {
      setInstallmentOptions([])
      setSelectedInstallments(1)
      setCardError(INSTALLMENTS_LOAD_ERROR)
    } finally {
      setInstallmentsLoading(false)
    }
  }

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

    if (!isValidCpf(cpf)) {
      setCardError("Informe um CPF valido")
      return null
    }

    try {
      const tokenBody: Record<string, unknown> = {
        cardholderName: cardholderName.trim(),
        identificationType: "CPF",
        identificationNumber: cpf.replace(/\D/g, ""),
      }
      const tokenData = await mpRef.current.fields.createCardToken(tokenBody)
      const paymentMethodId = extractPaymentMethodId(tokenData) || "master"
      if (!paymentMethodId) {
        setCardError("Nao foi possivel identificar a bandeira do cartao")
        return null
      }
      return {
        token: tokenData.id as string,
        paymentMethodId,
        issuerId: (tokenData.issuer_id as string) || null,
        installments: selectedInstallments,
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

      <div className="space-y-2">
        <Label>Parcelamento</Label>
        <select
          value={selectedInstallments}
          onChange={(event) => setSelectedInstallments(Number(event.target.value))}
          disabled={!installmentOptions.length || installmentsLoading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          {installmentOptions.length ? installmentOptions.map((option) => (
            <option key={option.installments} value={option.installments}>{option.message}</option>
          )) : <option value={1}>{installmentsLoading ? "Carregando parcelas..." : "Digite o numero do cartao"}</option>}
        </select>
        <InstallmentFeeNotice amount={amount} option={installmentOptions.find(option => option.installments === selectedInstallments)} />
      </div>

      {(error || cardError || configError) && <p className="text-sm text-red-600">{error || cardError || configError}</p>}

      {!ready && !configError ? <p className="text-sm text-slate-500">Carregando meio de pagamento...</p> : null}
    </div>
  )
})

function InstallmentFeeNotice({ amount, option }: { amount: number; option?: InstallmentOption }) {
  if (!option) return null

  const feeAmount = option.totalAmount - amount
  if (feeAmount <= 0.01) {
    return <p className="text-xs text-slate-500">Sem juros para o cliente nesta opcao.</p>
  }

  return (
    <p className="text-xs text-slate-500">
      Total parcelado: {formatCurrency(option.totalAmount)}. Taxa do parcelamento: {formatCurrency(feeAmount)}.
    </p>
  )
}

function formatInstallmentMessage(installments: number, installmentAmount: number, totalAmount: number, amount: number) {
  const feeText = totalAmount > amount + 0.01 ? " com juros" : " sem juros"
  return `${installments}x de ${formatCurrency(installmentAmount)}${feeText}`
}

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`
}

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
  if (bin.startsWith("4")) return "visa"
  if (/^(5[1-5]|2[2-7])/.test(bin)) return "master"
  if (bin.startsWith("34") || bin.startsWith("37")) return "amex"
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(bin)) return "elo"
  return ""
}
