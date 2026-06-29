"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"
import { formatCep, formatDateBr, generateTimeSlots, nextAvailableDateForDay } from "@/lib/checkout-utils"
import { deliveryDayLabels } from "@/lib/api"
import type { Address, ShippingQuote, StationDeliverySettings, SiteContactSettings } from "@/lib/api"

type NewAddr = {
  label: string
  recipientName: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  isDefault: boolean
}

export function AddressSection({
  cep,
  addresses,
  selectedAddressId,
  showNewAddress,
  newAddr,
  shippingOptions,
  selectedShipping,
  stationDelivery,
  stationDeliveryLoading,
  useStationDelivery,
  selectedDeliveryDay,
  selectedDeliveryDate,
  selectedStation,
  stationRecipientName,
  selectedTimeSlot,
  useUberDelivery,
  uberRecipientName,
  shippingLoading,
  cepLoading,
  saving,
  hasPersonalization,
  onSelectAddress,
  onAddNew,
  onBackToSaved,
  onSetNewAddr,
  onSaveNewAddress,
  onResetNewAddress,
  onSelectShipping,
  onSelectStationDelivery,
  onSelectUberDelivery,
  onSetStationRecipientName,
  onSetDeliveryDay,
  onSetStation,
  onSetTimeSlot,
  onSetUberRecipientName,
  onLookupCep,
  onGoToStep2,
}: {
  cep: string
  addresses: Address[]
  selectedAddressId: string | null
  showNewAddress: boolean
  newAddr: NewAddr
  shippingOptions: ShippingQuote[]
  selectedShipping: string
  stationDelivery: StationDeliverySettings | null
  stationDeliveryLoading: boolean
  useStationDelivery: boolean
  selectedDeliveryDay: string
  selectedDeliveryDate: string
  selectedStation: string
  stationRecipientName: string
  selectedTimeSlot: string
  useUberDelivery: boolean
  uberRecipientName: string
  shippingLoading: boolean
  cepLoading: boolean
  saving: boolean
  hasPersonalization: boolean
  onSelectAddress: (addr: Address) => void
  onAddNew: () => void
  onBackToSaved: () => void
  onSetNewAddr: (p: NewAddr | ((prev: NewAddr) => NewAddr)) => void
  onSaveNewAddress: () => void
  onResetNewAddress: () => void
  onSelectShipping: (id: string) => void
  onSelectStationDelivery: () => void
  onSelectUberDelivery: () => void
  onSetStationRecipientName: (v: string) => void
  onSetDeliveryDay: (day: string) => void
  onSetStation: (station: string) => void
  onSetTimeSlot: (slot: string) => void
  onSetUberRecipientName: (v: string) => void
  onLookupCep: (digits: string) => Promise<void>
  onGoToStep2: () => void
}) {
  const canGoToStep2 = selectedShipping || (useStationDelivery && stationRecipientName && selectedDeliveryDay && selectedDeliveryDate && selectedStation && selectedTimeSlot)

  return (
    <>
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
                onChange={() => onSelectAddress(addr)}
                className="mt-1"
              />
              <span className="leading-5">
                <strong>{addr.label}</strong>: {addr.street}, {addr.number}
                {addr.complement ? ` - ${addr.complement}` : ""} - {addr.neighborhood}, {addr.city}/{addr.state} - CEP {addr.cep}
              </span>
            </label>
          ))}
          <Button variant="ghost" size="sm" onClick={onAddNew}>
            <Plus className="mr-1 h-3 w-3" /> Novo endereço
          </Button>
        </div>
      )}

      {showNewAddress && (
        <>
          <Button variant="ghost" size="sm" onClick={onBackToSaved}>
            ← Voltar para endereços salvos
          </Button>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Identificação (ex: Casa, Trabalho)</Label>
              <Input value={newAddr.label} onChange={e => onSetNewAddr(p => ({ ...p, label: e.target.value }))} placeholder="Minha Casa" />
            </div>
            <div className="sm:col-span-2">
              <Label>Nome do destinatário</Label>
              <Input value={newAddr.recipientName} onChange={e => onSetNewAddr(p => ({ ...p, recipientName: e.target.value }))} placeholder="Nome de quem vai receber" />
            </div>
            <div>
              <Label>CEP</Label>
              <div className="relative">
                <Input
                  value={newAddr.cep}
                  onChange={e => onSetNewAddr(p => ({ ...p, cep: formatCep(e.target.value) }))}
                  onBlur={() => {
                    const digits = newAddr.cep.replace(/\D/g, "")
                    if (digits.length === 8) onLookupCep(digits)
                  }}
                  maxLength={9}
                  placeholder="00000-000"
                />
                {cepLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
              </div>
            </div>
            <div>
              <Label>Estado (UF)</Label>
              <Input value={newAddr.state} onChange={e => onSetNewAddr(p => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))} maxLength={2} placeholder="SP" />
            </div>
            <div className="sm:col-span-2">
              <Label>Rua</Label>
              <Input value={newAddr.street} onChange={e => onSetNewAddr(p => ({ ...p, street: e.target.value }))} placeholder="Rua..." />
            </div>
            <div>
              <Label>Número</Label>
              <Input value={newAddr.number} onChange={e => onSetNewAddr(p => ({ ...p, number: e.target.value }))} placeholder="123" />
            </div>
            <div>
              <Label>Complemento</Label>
              <Input value={newAddr.complement} onChange={e => onSetNewAddr(p => ({ ...p, complement: e.target.value }))} placeholder="Apto, Bloco..." />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={newAddr.neighborhood} onChange={e => onSetNewAddr(p => ({ ...p, neighborhood: e.target.value }))} placeholder="Centro" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={newAddr.city} onChange={e => onSetNewAddr(p => ({ ...p, city: e.target.value }))} placeholder="São Paulo" />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newAddr.isDefault} onChange={e => onSetNewAddr(p => ({ ...p, isDefault: e.target.checked }))} />
                Endereço padrão
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onSaveNewAddress} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar endereço
            </Button>
            <Button variant="outline" onClick={onResetNewAddress}>Cancelar</Button>
          </div>
        </>
      )}

      {!showNewAddress && addresses.length === 0 && (
        <Button onClick={onAddNew}>
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
                onChange={() => onSelectShipping(option.id)}
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
                onChange={onSelectStationDelivery}
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
                  onChange={e => onSetStationRecipientName(e.target.value)}
                  placeholder="Nome completo"
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <Label>Dia da semana</Label>
                <select
                  value={selectedDeliveryDay}
                  onChange={e => onSetDeliveryDay(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Selecione o próximo dia disponível</option>
                  {stationDelivery.stations && Object.entries(stationDelivery.stations).map(([dayKey, stations]) => (
                    <option key={dayKey} value={dayKey}>
                      {deliveryDayLabels[dayKey as keyof typeof deliveryDayLabels] || dayKey} ({formatDateBr(nextAvailableDateForDay(dayKey, hasPersonalization))}) - {stations.join(", ")}
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
                    onChange={e => onSetStation(e.target.value)}
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
                  onChange={e => onSetTimeSlot(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {generateTimeSlots(stationDelivery.timeSlots || []).map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              {hasPersonalization && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Itens personalizados podem levar até <strong>7 dias úteis</strong> para produção. As datas disponíveis já consideram esse prazo.
                </p>
              )}
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
                onChange={onSelectUberDelivery}
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
                  onChange={e => onSetUberRecipientName(e.target.value)}
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
              {hasPersonalization && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Itens personalizados podem levar até <strong>7 dias úteis</strong> para produção, além do prazo de entrega.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!showNewAddress && shippingLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Calculando frete...
        </div>
      )}

      {!showNewAddress && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onGoToStep2} disabled={!canGoToStep2} className="w-full sm:w-auto">
            Revisar pedido
          </Button>
        </div>
      )}
    </>
  )
}
