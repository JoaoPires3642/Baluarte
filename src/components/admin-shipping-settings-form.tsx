"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { lookupCep, type AdminShippingSettings, type AdminShippingSettingsUpdate } from "@/lib/api"
import { useAdminApi } from "@/lib/use-admin-api"

const fieldClass = "space-y-1"
const labelClass = "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function AdminShippingSettingsForm({ initialSettings }: { initialSettings: AdminShippingSettings }) {
  const { authedFetch } = useAdminApi()
  const [settings, setSettings] = useState<AdminShippingSettingsUpdate>({
    ...initialSettings,
    superfreteToken: "",
    automaticLabelEnabled: initialSettings.automaticLabelEnabled || false,
    automaticLabelRunTime: initialSettings.automaticLabelRunTime || "17:00",
    automaticLabelCutoffTime: initialSettings.automaticLabelCutoffTime || "15:00",
    packageOptions: initialSettings.packageOptions?.length ? initialSettings.packageOptions : [{
      name: "Padrao",
      maxQuantity: 999,
      heightCm: initialSettings.packageHeightCm,
      widthCm: initialSettings.packageWidthCm,
      lengthCm: initialSettings.packageLengthCm,
    }],
  })
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const update = (field: keyof AdminShippingSettingsUpdate, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  const updateNumber = (field: keyof AdminShippingSettingsUpdate, value: string) => {
    setSettings((current) => ({ ...current, [field]: Number(value) }))
  }

  const updatePackage = (index: number, field: "name" | "maxQuantity" | "heightCm" | "widthCm" | "lengthCm", value: string) => {
    setSettings((current) => ({
      ...current,
      packageOptions: current.packageOptions.map((option, optionIndex) => optionIndex === index
        ? { ...option, [field]: field === "name" ? value : Number(value) }
        : option),
    }))
  }

  const addPackage = () => {
    setSettings((current) => ({
      ...current,
      packageOptions: [
        ...current.packageOptions,
        { name: `Caixa ${current.packageOptions.length + 1}`, maxQuantity: 1, heightCm: 4, widthCm: 25, lengthCm: 35 },
      ],
    }))
  }

  const removePackage = (index: number) => {
    setSettings((current) => ({
      ...current,
      packageOptions: current.packageOptions.filter((_, optionIndex) => optionIndex !== index),
    }))
  }

  const lookupSenderCep = async () => {
    const digits = (settings.originCep || "").replace(/\D/g, "")
    if (digits.length !== 8) return

    setCepLoading(true)
    setCepError("")
    try {
      const result = await lookupCep(digits)
      setSettings((current) => ({
        ...current,
        originCep: result.cep || formatCep(digits),
        senderStreet: result.street || current.senderStreet,
        senderDistrict: result.neighborhood || current.senderDistrict,
        senderCity: result.city || current.senderCity,
        senderState: result.state || current.senderState,
      }))
    } catch (err) {
      setCepError(err instanceof Error ? err.message : "Erro ao consultar CEP")
    } finally {
      setCepLoading(false)
    }
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
        <Field label="Provider"><Input value={settings.provider} onChange={(e) => { update("provider", e.target.value); }} /></Field>
        <Field label="CEP de origem">
          <div className="relative">
            <Input
              value={settings.originCep}
              onChange={(e) => { update("originCep", formatCep(e.target.value)); }}
              onBlur={lookupSenderCep}
              maxLength={9}
              placeholder="00000-000"
            />
            {cepLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
          </div>
          {cepError && <p className="text-xs normal-case tracking-normal text-red-600">{cepError}</p>}
        </Field>
        <Field label="URL base"><Input value={settings.superfreteBaseUrl} onChange={(e) => { update("superfreteBaseUrl", e.target.value); }} /></Field>
        <Field label="Token sandbox/producao">
          <Input value={settings.superfreteToken || ""} onChange={(e) => { update("superfreteToken", e.target.value); }} placeholder={settings.superfreteTokenConfigured ? "Token configurado. Preencha apenas para trocar." : "Cole o token aqui"} />
        </Field>
        <Field label="Servicos"><Input value={settings.superfreteServices} onChange={(e) => { update("superfreteServices", e.target.value); }} /></Field>
        <Field label="User-Agent"><Input value={settings.superfreteUserAgent} onChange={(e) => { update("superfreteUserAgent", e.target.value); }} /></Field>
        <Field label="Cart path"><Input value={settings.superfreteCartPath} onChange={(e) => { update("superfreteCartPath", e.target.value); }} /></Field>
        <Field label="Checkout path"><Input value={settings.superfreteCheckoutPath} onChange={(e) => { update("superfreteCheckoutPath", e.target.value); }} /></Field>
        <Field label="Label link path"><Input value={settings.superfreteLabelLinkPath} onChange={(e) => { update("superfreteLabelLinkPath", e.target.value); }} /></Field>
      </section>

      <section className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Pacotes e peso do produto</h2>
            <p className="mt-1 text-sm text-slate-500">Configure as caixas por capacidade. O sistema usa a menor caixa que comporta a quantidade de camisas.</p>
          </div>
          <Button type="button" variant="outline" onClick={addPackage} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Adicionar pacote
          </Button>
        </div>
        <div className="max-w-xs">
          <Field label="Peso de uma camisa (kg)">
            <Input type="number" step="0.001" min="0.001" value={settings.packageWeightKg} onChange={(e) => { updateNumber("packageWeightKg", e.target.value); }} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {settings.packageOptions.map((option, index) => (
            <div key={option.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">Pacote {index + 1}</p>
                {settings.packageOptions.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => { removePackage(index); }} aria-label="Remover pacote">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Nome"><Input value={option.name} onChange={(e) => { updatePackage(index, "name", e.target.value); }} /></Field></div>
                <Field label="Ate quantas camisas"><Input type="number" min="1" value={option.maxQuantity} onChange={(e) => { updatePackage(index, "maxQuantity", e.target.value); }} /></Field>
                <Field label="Altura cm"><Input type="number" min="1" value={option.heightCm} onChange={(e) => { updatePackage(index, "heightCm", e.target.value); }} /></Field>
                <Field label="Largura cm"><Input type="number" min="1" value={option.widthCm} onChange={(e) => { updatePackage(index, "widthCm", e.target.value); }} /></Field>
                <Field label="Comprimento cm"><Input type="number" min="1" value={option.lengthCm} onChange={(e) => { updatePackage(index, "lengthCm", e.target.value); }} /></Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="text-lg font-bold">Automacao de etiquetas</h2>
          <p className="mt-1 text-sm text-slate-500">Gera automaticamente etiquetas dos pedidos pagos. Pedidos feitos depois do corte ficam para o proximo dia.</p>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={!!settings.automaticLabelEnabled}
            onChange={(e) => { setSettings((current) => ({ ...current, automaticLabelEnabled: e.target.checked })); }}
          />
          Gerar etiquetas automaticamente
        </label>
        <Field label="Horario para gerar"><Input type="time" value={settings.automaticLabelRunTime || "17:00"} onChange={(e) => { update("automaticLabelRunTime", e.target.value); }} /></Field>
        <Field label="Horario de corte"><Input type="time" value={settings.automaticLabelCutoffTime || "15:00"} onChange={(e) => { update("automaticLabelCutoffTime", e.target.value); }} /></Field>
        <p className="text-xs text-slate-500 sm:col-span-2">Exemplo: corte 15:00 e geração 17:00. Pedidos pagos até 15:00 entram no lote do dia; depois disso ficam para o próximo ciclo.</p>
      </section>

      <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-lg font-bold">Remetente</h2>
        <Field label="Nome completo"><Input value={settings.senderName} onChange={(e) => { update("senderName", e.target.value); }} /></Field>
        <Field label="Telefone"><Input value={settings.senderPhone} onChange={(e) => { update("senderPhone", e.target.value); }} /></Field>
        <Field label="Email"><Input value={settings.senderEmail} onChange={(e) => { update("senderEmail", e.target.value); }} /></Field>
        <Field label="CPF/CNPJ"><Input value={settings.senderDocument} onChange={(e) => { update("senderDocument", e.target.value); }} /></Field>
        <Field label="Rua"><Input value={settings.senderStreet} onChange={(e) => { update("senderStreet", e.target.value); }} /></Field>
        <Field label="Numero"><Input value={settings.senderNumber} onChange={(e) => { update("senderNumber", e.target.value); }} /></Field>
        <Field label="Complemento"><Input value={settings.senderComplement || ""} onChange={(e) => { update("senderComplement", e.target.value); }} /></Field>
        <Field label="Bairro"><Input value={settings.senderDistrict} onChange={(e) => { update("senderDistrict", e.target.value); }} /></Field>
        <Field label="Cidade"><Input value={settings.senderCity} onChange={(e) => { update("senderCity", e.target.value); }} /></Field>
        <Field label="UF"><Input value={settings.senderState} maxLength={2} onChange={(e) => { update("senderState", e.target.value.toUpperCase()); }} /></Field>
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
