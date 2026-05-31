"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2, MapPin, MapPinned, Plus, Truck } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/context/toast-context"
import { useUser } from "@clerk/nextjs"
import { fetchShippingQuotes, createPayment, fetchAddresses, syncAddresses, lookupCep, type Address, type PaymentResponse, type ShippingQuote } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PaymentPixModal } from "@/components/payment-pix-modal"
import { PaymentCardForm, type PaymentCardFormRef } from "@/components/payment-card-form"

type PaymentMethod = "pix" | "card"
type CheckoutStep = 1 | 2 | 3
type CardTokenResult = { token: string; paymentMethodId: string; issuerId: string | null; installments: number }

function createAddressId() {
  return crypto.randomUUID()
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCart()
  const { showToast } = useToast()
  const { isSignedIn } = useUser()
  const cardFormRef = useRef<PaymentCardFormRef>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<CheckoutStep>(1)
  const [cep, setCep] = useState("")
  const [shippingOptions, setShippingOptions] = useState<ShippingQuote[]>([])
  const [selectedShipping, setSelectedShipping] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix")
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null)
  const [paymentError, setPaymentError] = useState("")
  const [pixModal, setPixModal] = useState<{ qrCodeBase64: string; copyPasteCode: string; orderReference: string } | null>(null)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddress, setShowNewAddress] = useState(false)

  const [address, setAddress] = useState({
    recipientName: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  })

  const [payer, setPayer] = useState({
    email: "",
    cpf: "",
  })

  const [cepLoading, setCepLoading] = useState(false)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newAddr, setNewAddr] = useState({
    label: "",
    recipientName: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    isDefault: false,
  })

  const loadAddresses = useCallback(async () => {
    if (!isSignedIn) return
    try {
      const data = await fetchAddresses()
      setAddresses(data)
      const defaultAddr = data.find(a => a.isDefault) || data[0]
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.addressId)
        setAddress({
          street: defaultAddr.street,
          recipientName: defaultAddr.recipientName || "",
          number: defaultAddr.number,
          complement: defaultAddr.complement || "",
          neighborhood: defaultAddr.neighborhood,
          city: defaultAddr.city,
          state: defaultAddr.state,
        })
        setCep(defaultAddr.cep)
      }
    } catch {
      // not signed in or error
    }
  }, [isSignedIn])

  useEffect(() => {
    loadAddresses()
  }, [loadAddresses])

  const selectAddress = (addr: Address) => {
    setSelectedAddressId(addr.addressId)
    setAddress({
      street: addr.street,
      recipientName: addr.recipientName || "",
      number: addr.number,
      complement: addr.complement || "",
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
    })
    setCep(addr.cep)
    setShowNewAddress(false)
    setShippingOptions([])
    setSelectedShipping("")
    triggerShippingQuote()
  }

  const handleCepBlur = async () => {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) return

    setCepLoading(true)
    try {
      const result = await lookupCep(digits)
      setAddress(prev => ({
        ...prev,
        street: result.street || prev.street,
        neighborhood: result.neighborhood || prev.neighborhood,
        city: result.city || prev.city,
        state: result.state || prev.state,
      }))
    } catch {
      // ignore
    } finally {
      setCepLoading(false)
    }
  }

  const triggerShippingQuote = useCallback(async () => {
    const digits = cep.replace(/\D/g, "")
    if (digits.length < 8 || !address.street || !address.state || items.length === 0) return
    setShippingLoading(true)
    try {
      const res = await fetchShippingQuotes({
        cep: digits,
        street: address.street,
        number: address.number,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      }, items.length)
      setShippingOptions(res.data.options || [])
      if (res.data.options?.length > 0) {
        setSelectedShipping(res.data.options[0].id)
      }
    } catch {
      // ignore
    } finally {
      setShippingLoading(false)
    }
  }, [cep, address, items.length])

  useEffect(() => {
    const digits = cep.replace(/\D/g, "")
    if (digits.length === 8 && address.street && address.state) {
      const timer = setTimeout(() => triggerShippingQuote(), 600)
      return () => clearTimeout(timer)
    }
  }, [cep, address.street, address.state, triggerShippingQuote])

  const resetNewAddress = () => {
    setNewAddr({ label: "", recipientName: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", isDefault: false })
    setShowNewAddress(false)
  }

  const handleSaveNewAddress = async () => {
    if (!newAddr.label || !newAddr.recipientName || !newAddr.cep || !newAddr.street || !newAddr.number || !newAddr.neighborhood || !newAddr.city || !newAddr.state) {
      showToast("Preencha todos os campos obrigatórios", "error")
      return
    }

    setSaving(true)
    try {
      const list = addresses.map(a => ({
        addressId: a.addressId,
        recipientName: a.recipientName || "",
        label: a.label,
        cep: a.cep,
        street: a.street,
        number: a.number,
        complement: a.complement || "",
        neighborhood: a.neighborhood,
        city: a.city,
        state: a.state,
        isDefault: a.isDefault,
      }))
      const newAddressId = createAddressId()
      const shouldUseNewAddressAsDefault = newAddr.isDefault || list.length === 0
      list.push({
        addressId: newAddressId,
        recipientName: newAddr.recipientName,
        label: newAddr.label,
        cep: newAddr.cep.replace(/\D/g, ""),
        street: newAddr.street,
        number: newAddr.number,
        complement: newAddr.complement || "",
        neighborhood: newAddr.neighborhood,
        city: newAddr.city,
        state: newAddr.state,
        isDefault: shouldUseNewAddressAsDefault,
      })
      const defaultAddressId = shouldUseNewAddressAsDefault
        ? newAddressId
        : list.find(a => a.isDefault)?.addressId
      const normalizedList = list.map(a => ({
        ...a,
        isDefault: a.addressId === defaultAddressId,
      }))

      await syncAddresses(normalizedList, defaultAddressId)
      await loadAddresses()
      resetNewAddress()
      showToast("Endereço salvo!", "success")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao salvar endereço", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleCepSearch = async () => {
    const digits = cep.replace(/\D/g, "")
    if (digits.length < 8) {
      showToast("Informe um CEP válido", "error")
      return
    }
    setLoading(true)
    try {
      const res = await fetchShippingQuotes({
        cep: digits,
        street: address.street,
        number: address.number,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      }, items.length)
      setShippingOptions(res.data.options || [])
      if (res.data.options?.length > 0) {
        setSelectedShipping(res.data.options[0].id)
        showToast("Frete calculado com sucesso!", "success")
      } else {
        showToast("CEP não encontrado", "error")
      }
    } catch {
      showToast("Erro ao buscar frete", "error")
    }
    setLoading(false)
  }

  const handleSubmit = async (cardOverride?: CardTokenResult) => {
    if (!isSignedIn) {
      showToast("Faça login para finalizar o pedido", "error")
      router.push("/sign-in?redirect_url=/checkout")
      return
    }

    if (!selectedShipping || items.length === 0) {
      showToast("Adicione itens ao carrinho", "error")
      return
    }

    if (!payer.email || !payer.cpf) {
      showToast("Preencha email e CPF", "error")
      return
    }

    const addr = showNewAddress && newAddr.street ? newAddr : address
    if (!addr.recipientName || !addr.street || !addr.neighborhood || !addr.city) {
      showToast("Preencha o endereço completo", "error")
      return
    }

    const shipping = shippingOptions.find((s) => s.id === selectedShipping)
    if (!shipping) return

    const cardData = cardOverride || (paymentMethod === "card" ? await cardFormRef.current?.createToken() : null)

    if (paymentMethod === "card" && !cardData) {
      showToast("Preencha os dados do cartão corretamente", "error")
      return
    }

    setLoading(true)
    setPaymentError("")
    try {
      // Save new address to profile if user is signed in and it's a new one
      if (isSignedIn && !selectedAddressId && cep && addr.street) {
        try {
          const existing = addresses.map(a => ({
            addressId: a.addressId,
            recipientName: a.recipientName || "",
            label: a.label,
            cep: a.cep,
            street: a.street,
            number: a.number,
            complement: a.complement || "",
            neighborhood: a.neighborhood,
            city: a.city,
            state: a.state,
            isDefault: a.isDefault,
          }))
          await syncAddresses([
            ...existing,
            {
              addressId: "",
              recipientName: addr.recipientName,
              label: addr.street.split(" ")[0] || "Endereço",
              cep: cep.replace(/\D/g, ""),
              street: addr.street,
              number: addr.number,
              complement: "",
              neighborhood: addr.neighborhood,
              city: addr.city,
              state: addr.state,
              isDefault: existing.length === 0,
            },
          ])
        } catch {
          // non-critical - order still goes through
        }
      }

      const res = await createPayment({
        checkoutSessionId: `session_${Date.now()}`,
        idempotencyKey: `key_${Date.now()}`,
        method: paymentMethod,
        payer: {
          email: payer.email,
          identification: { type: "CPF" as const, number: payer.cpf },
        },
        shippingAddress: {
          recipientName: addr.recipientName,
          cep: cep.replace(/\D/g, ""),
          street: addr.street,
          number: addr.number,
          complement: addr.complement || undefined,
          neighborhood: addr.neighborhood,
          city: addr.city,
          state: addr.state,
        },
        shipping: {
          optionId: shipping.id,
          label: shipping.label,
          price: shipping.price,
        },
        card: paymentMethod === "card" && cardData ? {
          token: cardData.token,
          paymentMethodId: cardData.paymentMethodId,
          issuerId: cardData.issuerId || undefined,
          installments: cardData.installments,
        } : undefined,
        items: items.map((item) => ({
          productId: item.id,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      })

      setPaymentResult(res.data)

      if (paymentMethod === "pix" && res.data.pix) {
        setPixModal({
          qrCodeBase64: res.data.pix.qrCodeBase64,
          copyPasteCode: res.data.pix.copyPasteCode,
          orderReference: res.data.orderReference,
        })
        showToast("Pedido realizado com sucesso!", "success")
      } else if (res.data.status === "approved" || res.data.status === "pending") {
        clear()
        showToast("Pedido realizado com sucesso!", "success")
        router.push(`/checkout/sucesso?order=${res.data.orderReference}`)
      } else {
        setPaymentError(`Pagamento ${res.data.status}: ${res.data.statusDetail}`)
        showToast("Erro no pagamento", "error")
      }
    } catch {
      setPaymentError("Erro ao processar pagamento")
      showToast("Erro ao processar pagamento", "error")
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
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
                <CardDescription>Informe onde deseja receber seu pedido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.length > 0 && !showNewAddress && (
                  <div className="space-y-2">
                    <Label>Endereços salvos</Label>
                    {addresses.map(addr => (
                      <label
                        key={addr.addressId}
                        className={`flex items-start gap-3 rounded-2xl border p-3 text-sm cursor-pointer transition-colors ${
                          selectedAddressId === addr.addressId
                            ? "border-[#0f274d] bg-[#f4f7fb]"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="saved-address"
                          checked={selectedAddressId === addr.addressId}
                          onChange={() => selectAddress(addr)}
                          className="mt-1"
                        />
                        <span className="leading-5">
                          <strong>{addr.label}</strong>: {addr.street}, {addr.number}
                          {addr.complement ? ` - ${addr.complement}` : ""} - {addr.neighborhood}, {addr.city}/{addr.state} - CEP {addr.cep}
                        </span>
                      </label>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => { setShowNewAddress(true); setSelectedAddressId(null) }}>
                      <Plus className="mr-1 h-3 w-3" /> Novo endereço
                    </Button>
                  </div>
                )}

                {showNewAddress && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => { setShowNewAddress(false); setSelectedAddressId(addresses.find(a => a.isDefault)?.addressId || addresses[0]?.addressId || null) }}>
                      ← Voltar para endereços salvos
                    </Button>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label>Identificação (ex: Casa, Trabalho)</Label>
                        <Input value={newAddr.label} onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))} placeholder="Minha Casa" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Nome do destinatário</Label>
                        <Input value={newAddr.recipientName} onChange={e => setNewAddr(p => ({ ...p, recipientName: e.target.value }))} placeholder="Nome de quem vai receber" />
                      </div>
                      <div>
                        <Label>CEP</Label>
                        <div className="relative">
                          <Input
                            value={newAddr.cep}
                            onChange={e => setNewAddr(p => ({ ...p, cep: formatCep(e.target.value) }))}
                            onBlur={() => {
                              const digits = newAddr.cep.replace(/\D/g, "")
                              if (digits.length !== 8) return
                              setCepLoading(true)
                              lookupCep(digits).then(r => {
                                setNewAddr(p => ({
                                  ...p,
                                  street: r.street || p.street,
                                  neighborhood: r.neighborhood || p.neighborhood,
                                  city: r.city || p.city,
                                  state: r.state || p.state,
                                }))
                              }).catch(() => {}).finally(() => setCepLoading(false))
                            }}
                            maxLength={9}
                            placeholder="00000-000"
                          />
                          {cepLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
                        </div>
                      </div>
                      <div>
                        <Label>Estado (UF)</Label>
                        <Input value={newAddr.state} onChange={e => setNewAddr(p => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))} maxLength={2} placeholder="SP" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Rua</Label>
                        <Input value={newAddr.street} onChange={e => setNewAddr(p => ({ ...p, street: e.target.value }))} placeholder="Rua..." />
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input value={newAddr.number} onChange={e => setNewAddr(p => ({ ...p, number: e.target.value }))} placeholder="123" />
                      </div>
                      <div>
                        <Label>Complemento</Label>
                        <Input value={newAddr.complement} onChange={e => setNewAddr(p => ({ ...p, complement: e.target.value }))} placeholder="Apto, Bloco..." />
                      </div>
                      <div>
                        <Label>Bairro</Label>
                        <Input value={newAddr.neighborhood} onChange={e => setNewAddr(p => ({ ...p, neighborhood: e.target.value }))} placeholder="Centro" />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} placeholder="São Paulo" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={newAddr.isDefault} onChange={e => setNewAddr(p => ({ ...p, isDefault: e.target.checked }))} />
                          Endereço padrão
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveNewAddress} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar endereço
                      </Button>
                      <Button variant="outline" onClick={resetNewAddress}>Cancelar</Button>
                    </div>
                  </>
                )}

                {!showNewAddress && addresses.length === 0 && (
                  <Button onClick={() => setShowNewAddress(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Endereço
                  </Button>
                )}

                {!showNewAddress && shippingOptions.length > 0 && (
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

                {!showNewAddress && shippingLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Calculando frete...
                  </div>
                )}
              </CardContent>
              {!showNewAddress && (
                <CardFooter className="justify-end">
                  <Button variant="outline" onClick={() => setStep(2)} disabled={!selectedShipping} className="w-full sm:w-auto">
                    Revisar pedido
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}

          {step === 2 && (
            <Card>
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
                {(() => {
                  const a = showNewAddress && newAddr.street ? newAddr : address
                  return (
                    <div className="text-sm text-slate-600">
                      <p>{a.street}, {a.number}</p>
                      <p>{a.neighborhood}, {a.city} - {a.state}</p>
                      <p>{cep}</p>
                    </div>
                  )
                })()}
              </CardContent>
              <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto">Voltar</Button>
                <Button onClick={() => setStep(3)} disabled={!selectedShipping} className="w-full sm:w-auto">Confirmar e pagar</Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card>
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
                  <PaymentCardForm
                    ref={cardFormRef}
                    amount={total + shippingCost}
                    cpf={payer.cpf}
                    error={paymentError}
                  />
                ) : null}
              </CardContent>
              <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto">Voltar para revisao</Button>
              </CardFooter>
            </Card>
          )}
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

            </CardContent>
            <CardFooter>
              {paymentMethod === "pix" || !paymentResult ? (
                <Button className="w-full" onClick={() => handleSubmit()} disabled={loading || !selectedShipping || step < 3}>
                  {loading ? "Processando..." : "Finalizar Pedido"}
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        </div>
      </div>

      {pixModal && (
        <PaymentPixModal
          qrCodeBase64={pixModal.qrCodeBase64}
          copyPasteCode={pixModal.copyPasteCode}
          total={total + shippingCost}
          orderReference={pixModal.orderReference}
          onClose={() => {
            const ref = pixModal.orderReference
            setPixModal(null)
            clear()
            router.push(`/pedidos/${ref}`)
          }}
        />
      )}
    </div>
  )
}
