"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2, MapPin, MapPinned, Plus, Truck } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/context/toast-context"
import { useSession } from "next-auth/react"
import { fetchShippingQuotes, createPayment, fetchAddresses, syncAddresses, lookupCep, fetchStationDeliverySettings, fetchSiteContactSettings, deliveryDayLabels, type Address, type PaymentResponse, type ShippingQuote, type StationDeliverySettings, type SiteContactSettings } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PaymentPixModal } from "@/components/payment-pix-modal"
import { PaymentCardForm, type PaymentCardFormRef } from "@/components/payment-card-form"
import { isValidCpf, onlyCpfDigits } from "@/lib/cpf"

type PaymentMethod = "pix" | "card"
type CheckoutStep = 1 | 2 | 3
type CardTokenResult = { token: string; paymentMethodId: string; issuerId: string | null; installments: number }

const deliveryDayIndexes: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

function createAddressId() {
  return crypto.randomUUID()
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatDateBr(dateIso: string) {
  const [year, month, day] = dateIso.split("-")
  return `${day}/${month}/${year}`
}

const CUTOFF_HOUR = 18

function generateTimeSlots(ranges: string[]) {
  const slots: string[] = []
  for (const range of ranges) {
    const [start, end] = range.split("-")
    const [startH] = start.split(":").map(Number)
    const [endH] = end.split(":").map(Number)
    for (let h = startH; h < endH; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`)
      slots.push(`${String(h).padStart(2, "0")}:30`)
    }
  }
  return slots
}

function nextAvailableDateForDay(dayKey: string) {
  const targetDay = deliveryDayIndexes[dayKey]
  if (targetDay === undefined) return ""

  const today = new Date()
  const targetDate = new Date(today)
  let daysToAdd = (targetDay - today.getDay() + 7) % 7
  if (daysToAdd === 0) daysToAdd = 7
  if (daysToAdd === 1 && today.getHours() >= CUTOFF_HOUR) daysToAdd += 7
  targetDate.setDate(today.getDate() + daysToAdd)

  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, "0")
  const day = String(targetDate.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCart()
  const { showToast } = useToast()
  const { data: session } = useSession()
  const isSignedIn = session?.user != null
  const cardFormRef = useRef<PaymentCardFormRef>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<CheckoutStep>(1)
  const [cep, setCep] = useState("")
  const [shippingOptions, setShippingOptions] = useState<ShippingQuote[]>([])
  const [selectedShipping, setSelectedShipping] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix")
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null)
  const [paymentError, setPaymentError] = useState("")
  const [pixModal, setPixModal] = useState<{ qrCodeBase64: string; copyPasteCode: string; orderReference: string; whatsappHref?: string | null } | null>(null)

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

  const [stationDelivery, setStationDelivery] = useState<StationDeliverySettings | null>(null)
  const [stationDeliveryLoading, setStationDeliveryLoading] = useState(false)
  const [useStationDelivery, setUseStationDelivery] = useState(false)
  const [selectedDeliveryDay, setSelectedDeliveryDay] = useState("")
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState("")
  const [selectedStation, setSelectedStation] = useState("")
  const [stationRecipientName, setStationRecipientName] = useState("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("")

  const [useUberDelivery, setUseUberDelivery] = useState(false)
  const [uberRecipientName, setUberRecipientName] = useState("")
  const [contactSettings, setContactSettings] = useState<SiteContactSettings | null>(null)

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
      }, items.length, items.some((i) => i.personalizationConfirmed))
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

  useEffect(() => {
    setStationDeliveryLoading(true)
    fetchStationDeliverySettings().then(data => {
      setStationDelivery(data)
      if (data?.enabled && data.timeSlots?.length) {
        setSelectedTimeSlot(data.timeSlots[0])
      }
    }).catch(() => {}).finally(() => setStationDeliveryLoading(false))
    fetchSiteContactSettings().then(data => setContactSettings(data.data)).catch(() => {})
  }, [])

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

    if (!isValidCpf(payer.cpf)) {
      showToast("Informe um CPF válido", "error")
      return
    }

    const addr = (showNewAddress && newAddr.street ? newAddr : address) as Partial<Address>

    if (useUberDelivery) {
      if (!uberRecipientName) {
        showToast("Preencha o nome de quem vai receber", "error")
        return
      }
    } else if (useStationDelivery) {
      if (!stationRecipientName || !selectedDeliveryDay || !selectedDeliveryDate || !selectedStation || !selectedTimeSlot) {
        showToast("Preencha nome, dia, esta\u00e7\u00e3o e hor\u00e1rio da entrega", "error")
        return
      }
    } else if (!addr?.recipientName || !addr?.street || !addr?.neighborhood || !addr?.city) {
        showToast("Preencha o endere\u00e7o completo", "error")
        return
      }

    const shipping = useUberDelivery
      ? { id: "uber", label: "Uber / Retirar no local", price: 0, estimatedDays: "" }
      : shippingOptions.find((s) => s.id === selectedShipping)
    if (!shipping) return

    const cardData = cardOverride || (paymentMethod === "card" ? await cardFormRef.current?.createToken() : null)

    if (paymentMethod === "card" && !cardData) {
      showToast("Preencha os dados do cart\u00e3o corretamente", "error")
      return
    }

    setLoading(true)
    setPaymentError("")
    try {
      // Save new address to profile if user is signed in and it's a new one
      if (!useStationDelivery && !useUberDelivery && isSignedIn && !selectedAddressId && cep && addr?.street) {
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
              number: addr.number ?? "",
              complement: "",
              neighborhood: addr.neighborhood ?? "",
              city: addr.city ?? "",
              state: addr.state ?? "",
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
              cep: useUberDelivery ? "" : (addr?.cep ?? ""),
              street: useUberDelivery ? "" : (addr?.street ?? ""),
              number: useUberDelivery ? "" : (addr?.number ?? ""),
              complement: useUberDelivery ? "" : (addr?.complement ?? ""),
              neighborhood: useUberDelivery ? "" : (addr?.neighborhood ?? ""),
              city: useUberDelivery ? "" : (addr?.city ?? ""),
              state: useUberDelivery ? "" : (addr?.state ?? ""),
              recipientName: useUberDelivery ? uberRecipientName : (addr?.recipientName ?? ""),
              additionalInfo: useStationDelivery ? stationRecipientName : (useUberDelivery ? "Uber / Retirar no local" : ""),
            },
        shipping: {
          optionId: shipping.id,
          label: shipping.label,
          price: shipping.price,
        },
        shippingType: useUberDelivery ? "uber" : useStationDelivery ? "station" : "delivery",
        deliveryStation: useStationDelivery ? selectedStation : undefined,
        deliveryDay: useStationDelivery ? selectedDeliveryDay : undefined,
        deliveryDate: useStationDelivery ? selectedDeliveryDate : undefined,
        deliveryTimeSlot: useStationDelivery ? selectedTimeSlot : undefined,
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
          customNames: item.customNames?.length ? item.customNames : undefined,
          customNumber: item.customNumber || undefined,
        })),
      })

      setPaymentResult(res.data)

      const uberWhatsappHref = useUberDelivery ? buildUberWhatsappHref(contactSettings, items, res.data.orderReference) : null

      if (paymentMethod === "pix" && res.data.pix) {
        setPixModal({
          qrCodeBase64: res.data.pix.qrCodeBase64,
          copyPasteCode: res.data.pix.copyPasteCode,
          orderReference: res.data.orderReference,
          whatsappHref: uberWhatsappHref,
        })
        showToast("Pedido realizado com sucesso!", "success")
      } else if (res.data.status === "approved" || res.data.status === "pending") {
        clear()
        showToast("Pedido realizado com sucesso!", "success")
        const params = new URLSearchParams({ order: res.data.orderReference })
        if (useUberDelivery) params.set("uber", "1")
        router.push(`/checkout/sucesso?${params.toString()}`)
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

  const regularShippingCost = shippingOptions.find((s) => s.id === selectedShipping)?.price || 0
  const stationShippingCost = stationDelivery?.price || 10
  const shippingCost = useUberDelivery ? 0 : useStationDelivery ? stationShippingCost : regularShippingCost

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
        <h1 className="text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900">Checkout</h1>
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
                          checked={selectedShipping === option.id && !useStationDelivery && !useUberDelivery}
                          onChange={() => { setSelectedShipping(option.id); setUseStationDelivery(false); setUseUberDelivery(false) }}
                          className="mt-1 sm:mt-0"
                        />
                        <span className="leading-5">{option.label} - R$ {option.price.toFixed(2).replace(".", ",")} ({option.estimatedDays})</span>
                      </label>
                    ))}
                  </div>
                )}

                {!showNewAddress && stationDelivery?.enabled && !stationDeliveryLoading && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 rounded-2xl border p-3 text-sm cursor-pointer transition-colors"
                        style={{
                          borderColor: useStationDelivery ? "#0f274d" : "rgb(226 232 240)",
                          backgroundColor: useStationDelivery ? "#f4f7fb" : undefined,
                        }}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          checked={useStationDelivery}
                          onChange={() => {
                            setUseStationDelivery(true)
                            setUseUberDelivery(false)
                            setSelectedShipping("station")
                            if (stationDelivery.timeSlots?.length) {
                              setSelectedTimeSlot(stationDelivery.timeSlots[0])
                            }
                          }}
                          className="mt-1"
                        />
                        <span className="leading-5">
                          <strong>Entrega em Estação</strong> - R$ {stationDelivery.price?.toFixed(2).replace(".", ",") ?? "10,00"}
                        </span>
                      </label>
                    </div>

                    {useStationDelivery && (
                      <div className="ml-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <Label>Nome de quem vai receber</Label>
                          <Input
                            value={stationRecipientName}
                            onChange={e => setStationRecipientName(e.target.value)}
                            placeholder="Nome completo"
                            className="mt-1 bg-white"
                          />
                        </div>
                        <div>
                          <Label>Dia da semana</Label>
                          <select
                            value={selectedDeliveryDay}
                            onChange={e => {
                              setSelectedDeliveryDay(e.target.value)
                              setSelectedDeliveryDate(nextAvailableDateForDay(e.target.value))
                              setSelectedStation("")
                            }}
                            className="mt-1 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          >
                            <option value="">Selecione o próximo dia disponível</option>
                            {stationDelivery.stations && Object.entries(stationDelivery.stations).map(([dayKey, stations]) => (
                              <option key={dayKey} value={dayKey}>
                                {deliveryDayLabels[dayKey as keyof typeof deliveryDayLabels] || dayKey} ({formatDateBr(nextAvailableDateForDay(dayKey))}) - {stations.join(", ")}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-slate-500">Entregamos em estações apenas com agendamento. A data exibida é sempre o próximo dia de funcionamento disponível. Se o dia escolhido for hoje, o sistema avança automaticamente para a semana seguinte.</p>
                        </div>

                        {selectedDeliveryDay && stationDelivery.stations?.[selectedDeliveryDay] && (
                          <div>
                            <Label>Estação</Label>
                            <select
                              value={selectedStation}
                              onChange={e => setSelectedStation(e.target.value)}
                              className="mt-1 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                              <option value="">Selecione a estação</option>
                              {stationDelivery.stations[selectedDeliveryDay].map(station => (
                                <option key={station} value={station}>{station}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <Label>Horário</Label>
                          <select
                            value={selectedTimeSlot}
                            onChange={e => setSelectedTimeSlot(e.target.value)}
                            className="mt-1 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          >
                            {generateTimeSlots(stationDelivery.timeSlots || []).map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!showNewAddress && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 rounded-2xl border p-3 text-sm cursor-pointer transition-colors"
                        style={{
                          borderColor: useUberDelivery ? "#0f274d" : "rgb(226 232 240)",
                          backgroundColor: useUberDelivery ? "#f4f7fb" : undefined,
                        }}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          checked={useUberDelivery}
                          onChange={() => {
                            setUseUberDelivery(true)
                            setUseStationDelivery(false)
                            setSelectedShipping("uber")
                          }}
                          className="mt-1"
                        />
                        <span className="leading-5">
                          <strong>Quero pedir um Uber / Retirar no local</strong> - Grátis
                        </span>
                      </label>
                    </div>

                    {useUberDelivery && (
                      <div className="ml-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <Label>Nome de quem vai receber</Label>
                          <Input
                            value={uberRecipientName}
                            onChange={e => setUberRecipientName(e.target.value)}
                            placeholder="Nome completo"
                            className="mt-1 bg-white"
                          />
                        </div>
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                          <p className="font-medium">Disponível:</p>
                          <p>Segunda a Sexta: até 19:00</p>
                          <p>Sábado: até 14:00</p>
                          <p className="mt-1 text-xs text-blue-600">No momento, você paga apenas o valor do produto. A entrega (Uber ou retirada no local) combinamos direto pelo WhatsApp após a confirmação.</p>
                        </div>
                      </div>
                    )}
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
                  <Button variant="outline" onClick={() => setStep(2)} disabled={!selectedShipping || (useStationDelivery && (!stationRecipientName || !selectedDeliveryDay || !selectedDeliveryDate || !selectedStation || !selectedTimeSlot))} className="w-full sm:w-auto">
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
                {useStationDelivery ? (
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold">Entrega em Estação</p>
                    <p>{stationRecipientName}</p>
                    <p>{deliveryDayLabels[selectedDeliveryDay as keyof typeof deliveryDayLabels] || selectedDeliveryDay} - {formatDateBr(selectedDeliveryDate)}</p>
                    <p>Estação {selectedStation}</p>
                    <p>Horário: {selectedTimeSlot}</p>
                  </div>
                ) : (() => {
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
                    value={formatCpf(payer.cpf)}
                    onChange={(e) => setPayer({ ...payer, cpf: onlyCpfDigits(e.target.value) })}
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
                <span className="text-muted-foreground">{useStationDelivery ? "Entrega em Estação" : "Frete"}</span>
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
          whatsappHref={pixModal.whatsappHref}
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

function buildUberWhatsappHref(
  contactSettings: { whatsapp?: string | null; whatsappMessage?: string | null } | null,
  items: { name: string; size: string; quantity: number }[],
  orderReference: string,
): string | null {
  if (!contactSettings?.whatsapp) return null
  const productList = items.map(i => `${i.name} (${i.size}) x${i.quantity}`).join(", ")
  const message = `Olá! Fiz a compra do(s) produto(s): ${productList} pelo site (pedido #${orderReference}) e vou pedir um Uber para retirar. Pode me ajudar?`
  const digits = contactSettings.whatsapp.replace(/\D/g, "")
  if (!digits) return null
  const countryCode = digits.startsWith("55") ? digits : `55${digits}`
  const base = `https://wa.me/${countryCode}`
  return `${base}?text=${encodeURIComponent(message)}`
}
