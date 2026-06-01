"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type AdminShippingSettings, type AdminShippingSettingsUpdate } from "@/lib/api"
import { useAdminApi } from "@/lib/use-admin-api"

const fieldClass = "space-y-1"
const labelClass = "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"

export function AdminShippingSettingsForm({ initialSettings }: { initialSettings: AdminShippingSettings }) {
  const { authedFetch } = useAdminApi()
  const [settings, setSettings] = useState<AdminShippingSettingsUpdate>({ ...initialSettings, superfreteToken: "" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const update = (field: keyof AdminShippingSettingsUpdate, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  const updateNumber = (field: keyof AdminShippingSettingsUpdate, value: string) => {
    setSettings((current) => ({ ...current, [field]: Number(value) }))
  }

  const save = async () => {
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const response = await authedFetch("/admin/shipping-settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      }) as { data: AdminShippingSettings }
      setSettings({ ...response.data, superfreteToken: "" })
      setMessage("Configuracoes de frete salvas.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar configuracoes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-lg font-bold">SuperFrete</h2>
        <Field label="Provider"><Input value={settings.provider} onChange={(e) => update("provider", e.target.value)} /></Field>
        <Field label="CEP de origem"><Input value={settings.originCep} onChange={(e) => update("originCep", e.target.value)} /></Field>
        <Field label="URL base"><Input value={settings.superfreteBaseUrl} onChange={(e) => update("superfreteBaseUrl", e.target.value)} /></Field>
        <Field label="Token sandbox/producao">
          <Input value={settings.superfreteToken || ""} onChange={(e) => update("superfreteToken", e.target.value)} placeholder={settings.superfreteTokenConfigured ? "Token configurado. Preencha apenas para trocar." : "Cole o token aqui"} />
        </Field>
        <Field label="Servicos"><Input value={settings.superfreteServices} onChange={(e) => update("superfreteServices", e.target.value)} /></Field>
        <Field label="User-Agent"><Input value={settings.superfreteUserAgent} onChange={(e) => update("superfreteUserAgent", e.target.value)} /></Field>
        <Field label="Cart path"><Input value={settings.superfreteCartPath} onChange={(e) => update("superfreteCartPath", e.target.value)} /></Field>
        <Field label="Checkout path"><Input value={settings.superfreteCheckoutPath} onChange={(e) => update("superfreteCheckoutPath", e.target.value)} /></Field>
        <Field label="Label link path"><Input value={settings.superfreteLabelLinkPath} onChange={(e) => update("superfreteLabelLinkPath", e.target.value)} /></Field>
      </section>

      <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
        <h2 className="sm:col-span-3 text-lg font-bold">Pacote padrao</h2>
        <Field label="Peso kg"><Input type="number" step="0.001" value={settings.packageWeightKg} onChange={(e) => updateNumber("packageWeightKg", e.target.value)} /></Field>
        <Field label="Altura cm"><Input type="number" value={settings.packageHeightCm} onChange={(e) => updateNumber("packageHeightCm", e.target.value)} /></Field>
        <Field label="Largura cm"><Input type="number" value={settings.packageWidthCm} onChange={(e) => updateNumber("packageWidthCm", e.target.value)} /></Field>
        <Field label="Comprimento cm"><Input type="number" value={settings.packageLengthCm} onChange={(e) => updateNumber("packageLengthCm", e.target.value)} /></Field>
      </section>

      <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-lg font-bold">Remetente</h2>
        <Field label="Nome completo"><Input value={settings.senderName} onChange={(e) => update("senderName", e.target.value)} /></Field>
        <Field label="Telefone"><Input value={settings.senderPhone} onChange={(e) => update("senderPhone", e.target.value)} /></Field>
        <Field label="Email"><Input value={settings.senderEmail} onChange={(e) => update("senderEmail", e.target.value)} /></Field>
        <Field label="CPF/CNPJ"><Input value={settings.senderDocument} onChange={(e) => update("senderDocument", e.target.value)} /></Field>
        <Field label="Rua"><Input value={settings.senderStreet} onChange={(e) => update("senderStreet", e.target.value)} /></Field>
        <Field label="Numero"><Input value={settings.senderNumber} onChange={(e) => update("senderNumber", e.target.value)} /></Field>
        <Field label="Complemento"><Input value={settings.senderComplement || ""} onChange={(e) => update("senderComplement", e.target.value)} /></Field>
        <Field label="Bairro"><Input value={settings.senderDistrict} onChange={(e) => update("senderDistrict", e.target.value)} /></Field>
        <Field label="Cidade"><Input value={settings.senderCity} onChange={(e) => update("senderCity", e.target.value)} /></Field>
        <Field label="UF"><Input value={settings.senderState} maxLength={2} onChange={(e) => update("senderState", e.target.value.toUpperCase())} /></Field>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar configuracoes"}</Button>
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className={fieldClass}><span className={labelClass}>{label}</span>{children}</label>
}
