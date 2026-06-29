"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/context/toast-context"
import { useSession } from "next-auth/react"
import { fetchShippingQuotes, createPayment, fetchAddresses, syncAddresses, lookupCep, fetchStationDeliverySettings, fetchSiteContactSettings, type Address, type PaymentResponse, type ShippingQuote, type StationDeliverySettings, type SiteContactSettings } from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaymentPixModal } from "@/components/payment-pix-modal"
import { AddressSection } from "@/components/checkout-address-section"
import { ReviewSection } from "@/components/checkout-review-section"
import { PaymentSection } from "@/components/checkout-payment-section"
import { OrderSummary } from "@/components/checkout-order-summary"
import { buildUberWhatsappHref, createAddressId, nextAvailableDateForDay } from "@/lib/checkout-utils"
import { isValidCpf } from "@/lib/cpf"

type PaymentMethod = "pix" | "card"
type CheckoutStep = 1 | 2 | 3
type NewAddr = {
  label: string; recipientName: string; cep: string; street: string; number: string
  complement: string; neighborhood: string; city: string; state: string; isDefault: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCart()
  const { showToast } = useToast()
  const { data: session } = useSession()
  const isSignedIn = session?.user != null
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
  const [address, setAddress] = useState({ recipientName: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" })
  const [payer, setPayer] = useState({ email: "", cpf: "" })
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
  const [newAddr, setNewAddr] = useState<NewAddr>({ label: "", recipientName: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", isDefault: false })

  const hasPersonalization = items.some((i) => i.personalizationConfirmed)

  const loadAddresses = useCallback(async () => {
    if (!isSignedIn) return
    try {
      const data = await fetchAddresses()
      setAddresses(data)
      const defaultAddr = data.find(a => a.isDefault) || data[0]
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.addressId)
        setAddress({ street: defaultAddr.street, recipientName: defaultAddr.recipientName || "", number: defaultAddr.number, complement: defaultAddr.complement || "", neighborhood: defaultAddr.neighborhood, city: defaultAddr.city, state: defaultAddr.state })
        setCep(defaultAddr.cep)
      }
    } catch { /* not signed in */ }
  }, [isSignedIn])

  useEffect(() => { loadAddresses() }, [loadAddresses])

  const triggerShippingQuote = useCallback(async () => {
    const digits = cep.replace(/\D/g, "")
    if (digits.length < 8 || !address.street || !address.state || items.length === 0) return
    setShippingLoading(true)
    try {
      const res = await fetchShippingQuotes({ cep: digits, street: address.street, number: address.number, neighborhood: address.neighborhood, city: address.city, state: address.state }, items.length, hasPersonalization)
      setShippingOptions(res.data.options || [])
      if (res.data.options?.length > 0) setSelectedShipping(res.data.options[0].id)
    } catch { /* ignore */ } finally { setShippingLoading(false) }
  }, [cep, address, items.length, hasPersonalization])

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
      if (data?.enabled && data.timeSlots?.length) setSelectedTimeSlot(data.timeSlots[0])
    }).catch(() => {}).finally(() => setStationDeliveryLoading(false))
    fetchSiteContactSettings().then(data => setContactSettings(data.data)).catch(() => {})
  }, [])

  const selectAddress = (addr: Address) => {
    setSelectedAddressId(addr.addressId)
    setAddress({ street: addr.street, recipientName: addr.recipientName || "", number: addr.number, complement: addr.complement || "", neighborhood: addr.neighborhood, city: addr.city, state: addr.state })
    setCep(addr.cep)
    setShowNewAddress(false)
    setShippingOptions([])
    setSelectedShipping("")
    triggerShippingQuote()
  }

  const handleSaveNewAddress = async () => {
    const n = newAddr
    if (!n.label || !n.recipientName || !n.cep || !n.street || !n.number || !n.neighborhood || !n.city || !n.state) {
      showToast("Preencha todos os campos obrigatórios", "error"); return
    }
    setSaving(true)
    try {
      const list = addresses.map(a => ({ addressId: a.addressId, recipientName: a.recipientName || "", label: a.label, cep: a.cep, street: a.street, number: a.number, complement: a.complement || "", neighborhood: a.neighborhood, city: a.city, state: a.state, isDefault: a.isDefault }))
      const newAddressId = createAddressId()
      const shouldUseNewAddressAsDefault = n.isDefault || list.length === 0
      list.push({ addressId: newAddressId, recipientName: n.recipientName, label: n.label, cep: n.cep.replace(/\D/g, ""), street: n.street, number: n.number, complement: n.complement || "", neighborhood: n.neighborhood, city: n.city, state: n.state, isDefault: shouldUseNewAddressAsDefault })
      const defaultAddressId = shouldUseNewAddressAsDefault ? newAddressId : list.find(a => a.isDefault)?.addressId
      await syncAddresses(list.map(a => ({ ...a, isDefault: a.addressId === defaultAddressId })), defaultAddressId)
      await loadAddresses()
      setShowNewAddress(false)
      setNewAddr({ label: "", recipientName: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", isDefault: false })
      showToast("Endereço salvo!", "success")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao salvar endereço", "error")
    } finally { setSaving(false) }
  }

  const handleSubmit = async () => {
    if (!isSignedIn) { showToast("Faça login para finalizar o pedido", "error"); router.push("/sign-in?redirect_url=/checkout"); return }
    if (!selectedShipping || items.length === 0) { showToast("Adicione itens ao carrinho", "error"); return }
    if (!payer.email || !payer.cpf) { showToast("Preencha email e CPF", "error"); return }
    if (!isValidCpf(payer.cpf)) { showToast("Informe um CPF válido", "error"); return }

    const addr = (showNewAddress && newAddr.street ? newAddr : address) as Partial<Address>
    if (useUberDelivery) { if (!uberRecipientName) { showToast("Preencha o nome de quem vai receber", "error"); return } }
    else if (useStationDelivery) { if (!stationRecipientName || !selectedDeliveryDay || !selectedDeliveryDate || !selectedStation || !selectedTimeSlot) { showToast("Preencha nome, dia, estação e horário da entrega", "error"); return } }
    else if (!addr?.recipientName || !addr?.street || !addr?.neighborhood || !addr?.city) { showToast("Preencha o endereço completo", "error"); return }

    const shipping = useUberDelivery ? { id: "uber", label: "Uber / Retirar no local", price: 0, estimatedDays: "" } : shippingOptions.find((s) => s.id === selectedShipping)
    if (!shipping) return

    setLoading(true)
    setPaymentError("")
    try {
      if (!useStationDelivery && !useUberDelivery && isSignedIn && !selectedAddressId && cep && addr?.street) {
        try {
          const existing = addresses.map(a => ({ addressId: a.addressId, recipientName: a.recipientName || "", label: a.label, cep: a.cep, street: a.street, number: a.number, complement: a.complement || "", neighborhood: a.neighborhood, city: a.city, state: a.state, isDefault: a.isDefault }))
          await syncAddresses([...existing, { addressId: "", recipientName: addr.recipientName, label: addr.street.split(" ")[0] || "Endereço", cep: cep.replace(/\D/g, ""), street: addr.street, number: addr.number ?? "", complement: "", neighborhood: addr.neighborhood ?? "", city: addr.city ?? "", state: addr.state ?? "", isDefault: existing.length === 0 }])
        } catch { /* non-critical */ }
      }

      const res = await createPayment({
        checkoutSessionId: `session_${Date.now()}`,
        idempotencyKey: `key_${Date.now()}`,
        method: paymentMethod,
        payer: { email: payer.email, identification: { type: "CPF" as const, number: payer.cpf } },
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
        shipping: { optionId: shipping.id, label: shipping.label, price: shipping.price },
        shippingType: useUberDelivery ? "uber" : useStationDelivery ? "station" : "delivery",
        deliveryStation: useStationDelivery ? selectedStation : undefined,
        deliveryDay: useStationDelivery ? selectedDeliveryDay : undefined,
        deliveryDate: useStationDelivery ? selectedDeliveryDate : undefined,
        deliveryTimeSlot: useStationDelivery ? selectedTimeSlot : undefined,
        items: items.map((item) => ({ productId: item.id, size: item.size, quantity: item.quantity, unitPrice: item.price, customNames: item.customNames?.length ? item.customNames : undefined, customNumber: item.customNumber || undefined })),
      })

      setPaymentResult(res.data)
      const uberWhatsappHref = useUberDelivery ? buildUberWhatsappHref(contactSettings, items, res.data.orderReference) : null

      if (paymentMethod === "pix" && res.data.pix) {
        setPixModal({ qrCodeBase64: res.data.pix.qrCodeBase64, copyPasteCode: res.data.pix.copyPasteCode, orderReference: res.data.orderReference, whatsappHref: uberWhatsappHref })
        showToast("Pedido realizado com sucesso!", "success")
      } else if (res.data.status === "approved" || res.data.status === "pending") {
        clear(); showToast("Pedido realizado com sucesso!", "success")
        const params = new URLSearchParams({ order: res.data.orderReference })
        if (useUberDelivery) params.set("uber", "1")
        router.push(`/checkout/sucesso?${params.toString()}`)
      } else {
        setPaymentError(`Pagamento ${res.data.status}: ${res.data.statusDetail}`)
        showToast("Erro no pagamento", "error")
      }
    } catch { setPaymentError("Erro ao processar pagamento"); showToast("Erro ao processar pagamento", "error") }
    setLoading(false)
  }

  const regularShippingCost = shippingOptions.find((s) => s.id === selectedShipping)?.price || 0
  const stationShippingCost = stationDelivery?.price || 10
  const shippingCost = useUberDelivery ? 0 : useStationDelivery ? stationShippingCost : regularShippingCost

  if (items.length === 0) return (
    <div className="container mx-auto space-y-4 px-4 py-8 text-center">
      <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
      <Button onClick={() => router.push("/")}>Voltar às compras</Button>
    </div>
  )

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
                <AddressSection
                  cep={cep} addresses={addresses} selectedAddressId={selectedAddressId}
                  showNewAddress={showNewAddress} newAddr={newAddr}
                  shippingOptions={shippingOptions} selectedShipping={selectedShipping}
                  stationDelivery={stationDelivery} stationDeliveryLoading={stationDeliveryLoading}
                  useStationDelivery={useStationDelivery} selectedDeliveryDay={selectedDeliveryDay}
                  selectedDeliveryDate={selectedDeliveryDate} selectedStation={selectedStation}
                  stationRecipientName={stationRecipientName} selectedTimeSlot={selectedTimeSlot}
                  useUberDelivery={useUberDelivery} uberRecipientName={uberRecipientName}
                  shippingLoading={shippingLoading} cepLoading={cepLoading} saving={saving}
                  hasPersonalization={hasPersonalization}
                  onSelectAddress={selectAddress}
                  onAddNew={() => setShowNewAddress(true)}
                  onBackToSaved={() => { setShowNewAddress(false); setSelectedAddressId(addresses.find(a => a.isDefault)?.addressId || addresses[0]?.addressId || null) }}
                  onSetNewAddr={setNewAddr}
                  onSaveNewAddress={handleSaveNewAddress}
                  onResetNewAddress={() => { setNewAddr({ label: "", recipientName: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", isDefault: false }); setShowNewAddress(false) }}
                  onSelectShipping={(id) => { setSelectedShipping(id); setUseStationDelivery(false); setUseUberDelivery(false) }}
                  onSelectStationDelivery={() => { setUseStationDelivery(true); setUseUberDelivery(false); setSelectedShipping("station"); if (stationDelivery?.timeSlots?.length) setSelectedTimeSlot(stationDelivery.timeSlots[0]) }}
                  onSelectUberDelivery={() => { setUseUberDelivery(true); setUseStationDelivery(false); setSelectedShipping("uber") }}
                  onSetStationRecipientName={setStationRecipientName}
                  onSetDeliveryDay={(day) => { setSelectedDeliveryDay(day); setSelectedDeliveryDate(nextAvailableDateForDay(day, hasPersonalization)); setSelectedStation("") }}
                  onSetStation={setSelectedStation}
                  onSetTimeSlot={setSelectedTimeSlot}
                  onSetUberRecipientName={setUberRecipientName}
                  onLookupCep={async (digits) => { setCepLoading(true); try { const r = await lookupCep(digits); setNewAddr(p => ({ ...p, street: r.street || p.street, neighborhood: r.neighborhood || p.neighborhood, city: r.city || p.city, state: r.state || p.state })) } catch { } finally { setCepLoading(false) } }}
                  onGoToStep2={() => setStep(2)}
                />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Revisao</CardTitle>
                <CardDescription>Confira itens, endereco e frete antes do pagamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReviewSection
                  useStationDelivery={useStationDelivery} stationRecipientName={stationRecipientName}
                  selectedDeliveryDay={selectedDeliveryDay} selectedDeliveryDate={selectedDeliveryDate}
                  selectedStation={selectedStation} selectedTimeSlot={selectedTimeSlot}
                  onBack={() => setStep(1)} onConfirm={() => setStep(3)}
                />
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Pagamento</CardTitle>
                <CardDescription>Escolha como deseja pagar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PaymentSection
                  paymentMethod={paymentMethod} payer={payer} paymentError={paymentError}
                  total={total} shippingCost={shippingCost}
                  onSetPaymentMethod={setPaymentMethod} onSetPayer={setPayer} onBack={() => setStep(2)}
                />
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  {(!paymentResult || paymentMethod === "pix") && (
                    <Button className="w-full ml-auto" onClick={() => handleSubmit()} disabled={loading || step < 3}>
                      {loading ? "Processando..." : "Finalizar Pedido"}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          )}
        </div>

        <div>
          <Card className="lg:sticky lg:top-24">
            <CardHeader><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <OrderSummary
                shippingCost={shippingCost} useStationDelivery={useStationDelivery}
                loading={loading} hasShipping={!!selectedShipping} step={step}
                onSubmit={() => handleSubmit()}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {pixModal && (
        <PaymentPixModal
          qrCodeBase64={pixModal.qrCodeBase64} copyPasteCode={pixModal.copyPasteCode}
          total={total + shippingCost} orderReference={pixModal.orderReference}
          whatsappHref={pixModal.whatsappHref}
          onClose={() => { const ref = pixModal.orderReference; setPixModal(null); clear(); router.push(`/pedidos/${ref}`) }}
        />
      )}
    </div>
  )
}
