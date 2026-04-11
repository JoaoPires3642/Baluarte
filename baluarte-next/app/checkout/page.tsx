"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, MapPinned, ShieldCheck, Truck } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/context/toast-context"
import { fetchShippingQuotes, createPayment, type PaymentResponse, type ShippingQuote } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PaymentPixPanel } from "@/components/payment-pix-panel"

type PaymentMethod = "pix" | "card"
type CheckoutStep = 1 | 2 | 3

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCart()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<CheckoutStep>(1)
  const [cep, setCep] = useState("")
  const [shippingOptions, setShippingOptions] = useState<ShippingQuote[]>([])
  const [selectedShipping, setSelectedShipping] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix")
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null)
  const [paymentError, setPaymentError] = useState("")

  const [address, setAddress] = useState({
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
  })

  const [payer, setPayer] = useState({
    email: "",
    cpf: "",
  })

  const handleCepSearch = async () => {
    if (cep.length < 8) {
      showToast("Informe um CEP válido", "error")
      return
    }
    setLoading(true)
    try {
      const res = await fetchShippingQuotes(cep, "", items.length)
      setShippingOptions(res.data.options || [])
      if (res.data.options?.length > 0) {
        setSelectedShipping(res.data.options[0].id)
        setStep(2)
        showToast("Frete calculado com sucesso!", "success")
      } else {
        showToast("CEP não encontrado", "error")
      }
    } catch {
      showToast("Erro ao buscar frete", "error")
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!selectedShipping || items.length === 0) {
      showToast("Adicione itens ao carrinho", "error")
      return
    }

    if (!payer.email || !payer.cpf) {
      showToast("Preencha email e CPF", "error")
      return
    }

    if (!address.street || !address.neighborhood || !address.city) {
      showToast("Preencha o endereço completo", "error")
      return
    }

    const shipping = shippingOptions.find((s) => s.id === selectedShipping)
    if (!shipping) return

    setLoading(true)
    setPaymentError("")
    try {
      const res = await createPayment({
        checkoutSessionId: `session_${Date.now()}`,
        idempotencyKey: `key_${Date.now()}`,
        method: paymentMethod,
        payer: {
          email: payer.email,
          identification: { type: "CPF" as const, number: payer.cpf },
        },
        shippingAddress: {
          cep,
          street: address.street,
          number: address.number,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
        },
        shipping: {
          optionId: shipping.id,
          label: shipping.label,
          price: shipping.price,
        },
        items: items.map((item) => ({
          productId: item.id,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      })

      setPaymentResult(res.data)

      if (paymentMethod === "pix" && res.data.pix) {
        showToast("PIX gerado com sucesso!", "success")
        setStep(3)
      } else {
        clear()
        showToast("Pedido realizado com sucesso!", "success")
        router.push(`/checkout/sucesso?order=${res.data.orderReference}`)
      }
    } catch {
      const message = paymentMethod === "card"
        ? "Pagamento com cartao ainda nao esta completo nesta versao. Use PIX para testar."
        : "Erro ao processar pagamento"
      setPaymentError(message)
      showToast(message, "error")
    }
    setLoading(false)
  }

  const shippingCost = shippingOptions.find((s) => s.id === selectedShipping)?.price || 0

  if (items.length === 0) {
    return (
      <div className="container mx-auto space-y-4 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <Button onClick={() => router.push("/")}>Voltar às compras</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-4 text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900">Pagamento com mais clareza</h1>
        <p className="mt-2 text-sm text-slate-500">Fluxo segmentado em etapas para reduzir ruído e aumentar confiança.</p>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-sm">
        <span className={`rounded-full px-2 py-2 ${step === 1 ? "bg-[#0f274d]/10 text-[#0f274d]" : "bg-slate-100 text-slate-400"}`}>1 Endereco</span>
        <span className={`rounded-full px-2 py-2 ${step === 2 ? "bg-[#0f274d]/10 text-[#0f274d]" : "bg-slate-100 text-slate-400"}`}>2 Revisao</span>
        <span className={`rounded-full px-2 py-2 ${step === 3 ? "bg-[#0f274d]/10 text-[#0f274d]" : "bg-slate-100 text-slate-400"}`}>3 Pagamento</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className={step !== 1 ? "opacity-70" : ""}>
            <CardHeader>
              <CardTitle>Endereço de Entrega</CardTitle>
              <CardDescription>Informe onde deseja receber seu pedido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <MapPinned className="mt-3 hidden h-4 w-4 text-[#c3222a] sm:block" />
                <Input
                  placeholder="CEP"
                  value={cep}
                  onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                />
                <Button onClick={handleCepSearch} disabled={loading} className="w-full sm:w-auto">Buscar</Button>
              </div>

              {shippingOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Frete</Label>
                  {shippingOptions.map((option) => (
                    <label key={option.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3 text-sm sm:items-center">
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedShipping === option.id}
                        onChange={() => setSelectedShipping(option.id)}
                        className="mt-1 sm:mt-0"
                      />
                      <span className="leading-5">{option.label} - R$ {option.price.toFixed(2).replace(".", ",")} ({option.estimatedDays})</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Endereço</Label>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                  <Input
                    placeholder="Rua"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  />
                  <Input
                    placeholder="Numero"
                    value={address.number}
                    onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    placeholder="Bairro"
                    value={address.neighborhood}
                    onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    placeholder="Cidade"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    placeholder="UF"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase().slice(0, 2) })}
                  />
                </div>
              </div>
            </CardContent>
             <CardFooter className="justify-end">
               <Button onClick={handleCepSearch} disabled={loading} className="w-full sm:w-auto">
                {loading ? "Buscando..." : shippingOptions.length > 0 ? "Atualizar frete" : "Continuar"}
              </Button>
            </CardFooter>
          </Card>

          <Card className={step < 2 ? "opacity-70" : ""}>
            <CardHeader>
              <CardTitle>Revisao</CardTitle>
              <CardDescription>Confira itens, endereco e frete antes do pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 text-muted-foreground">{item.quantity}x {item.name} ({item.size})</span>
                  <span>R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
                </div>
              ))}
              <Separator />
              <div className="text-sm text-slate-600">
                <p>{address.street}, {address.number}</p>
                <p>{address.neighborhood}, {address.city} - {address.state}</p>
                <p>{cep}</p>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto">Voltar</Button>
              <Button onClick={() => setStep(3)} disabled={!selectedShipping} className="w-full sm:w-auto">Confirmar e pagar</Button>
            </CardFooter>
          </Card>

          <Card className={step < 3 ? "opacity-70" : ""}>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
              <CardDescription>Escolha como deseja pagar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant={paymentMethod === "pix" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("pix")}
                  className="w-full sm:w-auto"
                >
                  <Truck className="h-4 w-4" /> PIX
                </Button>
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("card")}
                  className="w-full sm:w-auto"
                >
                  <CreditCard className="h-4 w-4" /> Cartão
                </Button>
              </div>

              <Separator />

              {paymentMethod === "pix" ? (
                <PaymentPixPanel
                  total={total + shippingCost}
                  pix={paymentResult?.pix ?? null}
                  loading={loading}
                  error={paymentError}
                  onGeneratePix={handleSubmit}
                />
              ) : null}

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  placeholder="seu@email.com"
                  value={payer.email}
                  onChange={(e) => setPayer({ ...payer, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={payer.cpf}
                  onChange={(e) => setPayer({ ...payer, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                />
              </div>

              {paymentMethod === "card" ? (
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Fluxo de cartao ainda sera alinhado ao `Baluarte-web`. Por enquanto, use PIX para testar o checkout.
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto">Voltar para revisao</Button>
              {paymentMethod === "card" ? (
                <Button onClick={handleSubmit} disabled={loading || !selectedShipping} className="w-full sm:w-auto">
                  {loading ? "Processando..." : "Tentar pagamento"}
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 text-muted-foreground">{item.name} ({item.size}) x{item.quantity}</span>
                  <span>R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span>R$ {shippingCost.toFixed(2).replace(".", ",")}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R$ {(total + shippingCost).toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex items-start gap-2 rounded-[1.25rem] border border-[#e6edf6] bg-[#f8fbff] p-3 text-sm text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-[#0f274d]" />
                <span>Estrutura visual focada em leitura rápida dos dados críticos da compra.</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSubmit} disabled={loading || !selectedShipping || step < 3}>
                {loading ? "Processando..." : "Finalizar Pedido"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
