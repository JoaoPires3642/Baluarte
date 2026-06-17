"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAdminApi } from "@/lib/use-admin-api"

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday"]
const DAY_LABELS: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terca-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
}

interface StationDeliveryData {
  enabled: boolean
  price: number
  stations: Record<string, string[]>
  timeSlots: string[]
}

export function AdminStationDeliveryForm({ initialSettings }: { initialSettings: StationDeliveryData | null }) {
  const { authedFetch } = useAdminApi()
  const defaultStations: Record<string, string[]> = {
    monday: ["Ana Rosa", "Campo Limpo"],
    tuesday: ["Tucuruvi", "Tiradentes"],
    wednesday: ["Tatuape", "Corinthians Itaquera"],
    thursday: ["Osasco", "Pinheiros"],
    friday: ["Se", "Paulista"],
  }

  const [enabled, setEnabled] = useState(initialSettings?.enabled ?? false)
  const [price, setPrice] = useState(String(initialSettings?.price ?? "10.00"))
  const [stations, setStations] = useState<Record<string, string[]>>(
    initialSettings?.stations ?? defaultStations
  )
  const [timeSlots, setTimeSlots] = useState<string[]>(
    initialSettings?.timeSlots ?? ["10:00-14:00", "17:00-20:00"]
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const updateStation = (day: string, index: number, value: string) => {
    setStations(prev => ({
      ...prev,
      [day]: (prev[day] || ["", ""]).map((s, i) => i === index ? value : s),
    }))
  }

  const updateTimeSlot = (index: number, value: string) => {
    setTimeSlots(prev => prev.map((s, i) => i === index ? value : s))
  }

  const addTimeSlot = () => {
    setTimeSlots(prev => [...prev, "12:00-14:00"])
  }

  const removeTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index))
  }

  const save = async () => {
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const response = await authedFetch("/admin/station-delivery/settings", {
        method: "PUT",
        body: JSON.stringify({
          enabled,
          price: Number(price),
          stations,
          timeSlots,
        }),
      }) as { data: StationDeliveryData }
      setPrice(String(response.data.price))
      setMessage("Configuracoes de entrega em estacoes salvas.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar configuracoes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => { setEnabled(e.target.checked); }}
          />
          Ativar entrega em estacoes
        </label>

        <div className="max-w-xs">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Preco (R$)</span>
            <Input type="number" step="0.01" min="0" value={price} onChange={e => { setPrice(e.target.value); }} />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Estacoes por dia</h2>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {DAY_KEYS.map(day => (
            <div key={day} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <p className="mb-3 text-sm font-bold text-slate-900">{DAY_LABELS[day]}</p>
              <div className="space-y-2">
                {(stations[day] || ["", ""]).map((station, index) => (
                  <Input
                    key={`${day}-${index}`}
                    value={station}
                    onChange={e => { updateStation(day, index, e.target.value); }}
                    placeholder={`Estacao ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Horarios</h2>
          <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
            + Adicionar horario
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {timeSlots.map((slot, index) => (
            <div key={`slot-${index}`} className="flex items-center gap-2">
              <Input
                value={slot}
                onChange={e => { updateTimeSlot(index, e.target.value); }}
                placeholder="HH:MM-HH:MM"
              />
              {timeSlots.length > 1 && (
                <button
                  onClick={() => { removeTimeSlot(index); }}
                  className="shrink-0 text-sm text-red-500 hover:text-red-700"
                  aria-label="Remover horario"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar configuracoes"}
        </Button>
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
