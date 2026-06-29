"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAdminApi } from "@/lib/use-admin-api"
import type { SiteContactSettings } from "@/lib/api"

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

const fieldClass = "space-y-1"
const labelClass = "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"

export function AdminContactSettingsForm({ initialSettings }: { initialSettings: SiteContactSettings }) {
  const { authedFetch } = useAdminApi()
  const [settings, setSettings] = useState<SiteContactSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const update = (field: keyof SiteContactSettings, value: string | number | null) => {
    setSettings(current => ({ ...current, [field]: value }))
  }

  const save = async () => {
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const response = await authedFetch("/admin/contact-settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      }) as { data: SiteContactSettings }
      setSettings(response.data)
      setMessage("Configuracoes de contato salvas.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar configuracoes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="text-lg font-bold">Texto do rodape</h2>
          <p className="mt-1 text-sm text-slate-500">Mensagem exibida abaixo do logo no rodape. Se ficar vazio, ela some.</p>
        </div>
        <Field label="Mensagem">
          <Textarea
            value={settings.footerMessage || ""}
            onChange={event => { update("footerMessage", event.target.value); }}
            placeholder="Mensagem curta sobre a loja"
            rows={4}
            className="sm:col-span-2"
          />
        </Field>
      </section>

      <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="text-lg font-bold">Atendimento</h2>
          <p className="mt-1 text-sm text-slate-500">Campos vazios nao aparecem no site.</p>
        </div>
        <Field label="Email"><Input value={settings.email || ""} onChange={event => { update("email", event.target.value); }} /></Field>
        <Field label="Telefone"><Input value={formatPhone(settings.phone || "")} onChange={event => { update("phone", onlyDigits(event.target.value)); }} /></Field>
        <Field label="WhatsApp"><Input value={formatPhone(settings.whatsapp || "")} onChange={event => { update("whatsapp", onlyDigits(event.target.value)); }} /></Field>
        <Field label="Horario"><Input value={settings.businessHours || ""} onChange={event => { update("businessHours", event.target.value); }} /></Field>
      </section>

      <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="text-lg font-bold">Mensagem padrao do WhatsApp</h2>
          <p className="mt-1 text-sm text-slate-500">Texto pre-preenchido ao clicar no link do WhatsApp. Se ficar vazio, envia sem mensagem.</p>
        </div>
        <Field label="Mensagem">
          <Textarea
            value={settings.whatsappMessage || ""}
            onChange={event => { update("whatsappMessage", event.target.value); }}
            placeholder="Ola! Gostaria de mais informacoes..."
            rows={3}
            className="sm:col-span-2"
          />
        </Field>
      </section>

      <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="text-lg font-bold">Redes sociais</h2>
          <p className="mt-1 text-sm text-slate-500">Informe a URL completa. Icones sem URL nao aparecem.</p>
        </div>
        <Field label="Instagram"><Input value={settings.instagramUrl || ""} onChange={event => { update("instagramUrl", event.target.value); }} /></Field>
        <Field label="Facebook"><Input value={settings.facebookUrl || ""} onChange={event => { update("facebookUrl", event.target.value); }} /></Field>
        <Field label="YouTube"><Input value={settings.youtubeUrl || ""} onChange={event => { update("youtubeUrl", event.target.value); }} /></Field>
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
