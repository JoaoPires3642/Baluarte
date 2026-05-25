"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Home, MapPin, Package, Plus, Trash2, ChevronRight, Loader2 } from "lucide-react"
import { fetchAddresses, syncAddresses, lookupCep, type Address } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const TABS = [
  { key: "pedidos", label: "Pedidos", icon: Package },
  { key: "enderecos", label: "Endereços", icon: MapPin },
]

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export default function AccountPage() {
  const { isSignedIn, isLoaded } = useUser()
  const [activeTab, setActiveTab] = useState("pedidos")
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cepLoading, setCepLoading] = useState(false)

  const [form, setForm] = useState({
    label: "",
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
    try {
      const data = await fetchAddresses()
      setAddresses(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadAddresses()
    }
  }, [isLoaded, isSignedIn, loadAddresses])

  const resetForm = () => {
    setForm({ label: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", isDefault: false })
    setEditingId(null)
    setShowForm(false)
  }

  const handleCepBlur = async () => {
    const digits = form.cep.replace(/\D/g, "")
    if (digits.length !== 8) return

    setCepLoading(true)
    try {
      const result = await lookupCep(digits)
      setForm(prev => ({
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

  const handleSave = async () => {
    if (!form.label || !form.cep || !form.street || !form.number || !form.neighborhood || !form.city || !form.state) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    setSaving(true)
    try {
      const addressList = addresses.map(a => ({
        addressId: a.addressId,
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

      const newItem = {
        addressId: editingId || undefined,
        label: form.label,
        cep: form.cep.replace(/\D/g, ""),
        street: form.street,
        number: form.number,
        complement: form.complement || "",
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        isDefault: form.isDefault,
      }

      const updatedList = editingId
        ? addressList.map(a => a.addressId === editingId ? newItem : a)
        : [...addressList, newItem]

      const defaultAddr = updatedList.find(a => a.isDefault)
      await syncAddresses(updatedList, defaultAddr?.addressId)
      await loadAddresses()
      resetForm()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este endereço?")) return
    setSaving(true)
    try {
      const updatedList = addresses
        .filter(a => a.addressId !== id)
        .map(a => ({
          addressId: a.addressId,
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
      const defaultAddr = updatedList.find(a => a.isDefault)
      await syncAddresses(updatedList, defaultAddr?.addressId)
      await loadAddresses()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao remover")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (addr: Address) => {
    setForm({
      label: addr.label,
      cep: addr.cep,
      street: addr.street,
      number: addr.number,
      complement: addr.complement || "",
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      isDefault: addr.isDefault,
    })
    setEditingId(addr.addressId)
    setShowForm(true)
  }

  if (!isLoaded) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Faça login para acessar sua conta.</p>
        <Link href="/sign-in?redirect_url=/conta">
          <Button className="mt-4">Entrar</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
        <h1 className="mt-4 text-2xl font-bold">Minha Conta</h1>
      </div>

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:inline-flex">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-white text-[#0f274d] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "pedidos" && (
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">Acesse seus pedidos</p>
              <Link href="/pedidos">
                <Button variant="outline" className="mt-4">
                  Ver Pedidos <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {activeTab === "enderecos" && (
          <div className="space-y-4">
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo Endereço
              </Button>
            )}

            {showForm && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-4 text-lg font-bold">{editingId ? "Editar" : "Novo"} Endereço</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label>Identificação (ex: Casa, Trabalho)</Label>
                      <Input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="Minha Casa" />
                    </div>
                    <div>
                      <Label>CEP</Label>
                      <div className="relative">
                        <Input
                          value={form.cep}
                          onChange={e => setForm(p => ({ ...p, cep: formatCep(e.target.value) }))}
                          onBlur={handleCepBlur}
                          maxLength={9}
                          placeholder="00000-000"
                        />
                        {cepLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
                      </div>
                    </div>
                    <div>
                      <Label>Estado (UF)</Label>
                      <Input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))} maxLength={2} placeholder="SP" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Rua</Label>
                      <Input value={form.street} onChange={e => setForm(p => ({ ...p, street: e.target.value }))} placeholder="Rua..." />
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} placeholder="123" />
                    </div>
                    <div>
                      <Label>Complemento</Label>
                      <Input value={form.complement} onChange={e => setForm(p => ({ ...p, complement: e.target.value }))} placeholder="Apto, Bloco..." />
                    </div>
                    <div>
                      <Label>Bairro</Label>
                      <Input value={form.neighborhood} onChange={e => setForm(p => ({ ...p, neighborhood: e.target.value }))} placeholder="Centro" />
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="São Paulo" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />
                        Endereço padrão
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : addresses.length === 0 && !showForm ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">Nenhum endereço cadastrado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map(addr => (
                  <Card key={addr.addressId}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold">
                            {addr.label}
                            {addr.isDefault && <Badge variant="secondary" className="text-[10px]">Padrão</Badge>}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ""}
                          </p>
                          <p className="text-sm text-slate-500">
                            {addr.neighborhood} - {addr.city}/{addr.state}
                          </p>
                          <p className="text-xs text-slate-400">{addr.cep}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(addr)}>
                            <Home className="h-4 w-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(addr.addressId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
