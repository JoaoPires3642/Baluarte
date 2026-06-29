"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Truck } from "lucide-react"
import { PaymentCardForm, type PaymentCardFormRef } from "@/components/payment-card-form"
import { formatCpf } from "@/lib/checkout-utils"
import { onlyCpfDigits } from "@/lib/cpf"

type PaymentMethod = "pix" | "card"

export function PaymentSection({
  paymentMethod,
  payer,
  paymentError,
  total,
  shippingCost,
  onSetPaymentMethod,
  onSetPayer,
  onBack,
}: {
  paymentMethod: PaymentMethod
  payer: { email: string; cpf: string }
  paymentError: string
  total: number
  shippingCost: number
  onSetPaymentMethod: (m: PaymentMethod) => void
  onSetPayer: (p: { email: string; cpf: string } | ((prev: { email: string; cpf: string }) => { email: string; cpf: string })) => void
  onBack: () => void
}) {
  const cardFormRef = useRef<PaymentCardFormRef>(null)

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant={paymentMethod === "pix" ? "default" : "outline"}
          onClick={() => onSetPaymentMethod("pix")}
          className="w-full sm:w-auto"
        >
          <Truck className="h-4 w-4" /> PIX
        </Button>
        <Button
          variant={paymentMethod === "card" ? "default" : "outline"}
          onClick={() => onSetPaymentMethod("card")}
          className="w-full sm:w-auto"
        >
          <CreditCard className="h-4 w-4" /> Cartão
        </Button>
      </div>

      <Separator />

      {paymentMethod === "pix" ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center">
          <p className="text-sm font-medium text-yellow-800">
            Ao finalizar, um QR Code PIX será exibido para pagamento.
          </p>
          <p className="mt-1 text-xs text-yellow-600">
            O PIX tem validade de 10 minutos.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          placeholder="seu@email.com"
          value={payer.email}
          onChange={(e) => onSetPayer(p => ({ ...p, email: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>CPF</Label>
        <Input
          placeholder="000.000.000-00"
          value={formatCpf(payer.cpf)}
          onChange={(e) => onSetPayer(p => ({ ...p, cpf: onlyCpfDigits(e.target.value) }))}
        />
      </div>

      {paymentMethod === "card" ? (
        <PaymentCardForm
          ref={cardFormRef}
          amount={total + shippingCost}
          cpf={payer.cpf}
          error={paymentError}
        />
      ) : null}

      <div className="flex justify-between sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">Voltar para revisao</Button>
      </div>
    </>
  )
}
