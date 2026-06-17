"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Pencil, Search, Trash2, X, Users } from "lucide-react"
import { useAdminApi } from "@/lib/use-admin-api"
import { fetchCategories, type Category, type Team } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClose(); }} />
      <div className="relative z-[100] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onCancel(); }} />
      <div className="relative z-[60] w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Confirmar</Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminTeamsPage() {
  const { authedFetch } = useAdminApi()
  const [teams, setTeams] = useState<Team[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", categoryId: "", league: "", displayOrder: 0, logo: "" })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [tData, cData] = await Promise.all([
        authedFetch("/admin/teams"),
        fetchCategories(),
      ])
      setTeams(tData.data || [])
      setCategories(cData.data || [])
    } catch (err) {
      console.error("Failed to load data", err)
    } finally {
      setLoading(false)
    }
  }, [authedFetch])

  useEffect(() => { void loadData() }, [loadData])

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: "", slug: "", categoryId: "", league: "", displayOrder: 0, logo: "" })
    setError("")
    setDialogOpen(true)
  }

  const openEdit = (team: Team) => {
    setEditingId(team.id)
    setForm({
      name: team.name,
      slug: team.slug,
      categoryId: team.categoryId || "",
      league: team.league || "",
      displayOrder: team.displayOrder || 0,
      logo: team.logo || "",
    })
    setError("")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Nome é obrigatório"); return }
    if (!form.slug.trim()) { setError("Slug é obrigatório"); return }
    if (!form.categoryId) { setError("Selecione uma categoria"); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        categoryId: form.categoryId,
        league: form.league.trim() || undefined,
        displayOrder: form.displayOrder || 0,
        logo: form.logo.trim() || undefined,
      }
      if (editingId) {
        await authedFetch(`/admin/teams/${editingId}`, { method: "PUT", body: JSON.stringify(payload) })
      } else {
        await authedFetch("/admin/teams", { method: "POST", body: JSON.stringify(payload) })
      }
      setDialogOpen(false)
      await loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await authedFetch(`/admin/teams/${id}`, { method: "DELETE" })
      setDeleteConfirm(null)
      await loadData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao deletar")
    }
  }

  const filtered = teams.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase())
    const matchCategory = !categoryFilter || t.categorySlug === categoryFilter
    return matchSearch && matchCategory
  })

  if (loading) {
    return <div className="space-y-6 py-8"><p>Carregando...</p></div>
  }

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Times</h1>
        <Button onClick={openCreate} className="bg-[#0f274d]">
          <Plus className="h-4 w-4 mr-1" /> Novo Time
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar times..."
            value={search}
            onChange={e => { setSearch(e.target.value); }}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); }}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(team => (
          <div key={team.id} className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#0f274d]/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="h-10 w-10 rounded-full object-contain bg-[#f4f7fb] p-1" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f7fb] text-[#0f274d]">
                    <Users className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <span className="font-semibold">{team.name}</span>
                  <p className="text-xs text-slate-400">{team.slug}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">{team.league || "Sem liga"}</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Categoria: {categories.find(c => c.id === team.categoryId)?.name || team.categorySlug || "-"}
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { openEdit(team); }}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-red-500" onClick={() => { setDeleteConfirm(team.id); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-slate-500">Nenhum time encontrado</p>
        )}
      </div>

      <div className="space-y-3 sm:hidden">
        {filtered.map(team => (
          <div key={team.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="h-10 w-10 rounded-full object-contain bg-[#f4f7fb] p-1" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f7fb] text-[#0f274d]">
                    <Users className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <span className="font-semibold">{team.name}</span>
                  <p className="text-xs text-slate-400">{team.slug}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">{team.league || "Sem liga"}</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {categories.find(c => c.id === team.categoryId)?.name || team.categorySlug || "-"}
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(team)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-red-500" onClick={() => setDeleteConfirm(team.id)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-slate-500">Nenhum time encontrado</p>
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); }}>
        <h2 className="text-lg font-bold mb-4">{editingId ? "Editar Time" : "Novo Time"}</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={e => {
              const name = e.target.value
              setForm(f => ({ ...f, name, slug: editingId ? f.slug : slugify(name) }))
            }} placeholder="Ex: São Paulo" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={e => { setForm(f => ({ ...f, slug: e.target.value })); }} placeholder="ex: sao-paulo" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <select value={form.categoryId}
              onChange={e => { setForm(f => ({ ...f, categoryId: e.target.value })); }}
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Liga (opcional)</Label>
            <Input value={form.league} onChange={e => { setForm(f => ({ ...f, league: e.target.value })); }} placeholder="Ex: Serie A" />
          </div>
          <div className="space-y-2">
            <Label>Ordem de exibição</Label>
            <Input type="number" min="0" value={form.displayOrder}
              onChange={e => { setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 })); }} />
          </div>
          <div className="space-y-2">
            <Label>URL do escudo (logo)</Label>
            <Input value={form.logo} onChange={e => { setForm(f => ({ ...f, logo: e.target.value })); }} placeholder="https://assets.football-logos.cc/..." />
            {form.logo && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <img src={form.logo} alt="preview" className="h-8 w-8 rounded-full object-contain bg-[#f4f7fb] p-0.5" />
                <span>Pré-visualização</span>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#0f274d]">
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir time?"
        message="Esta ação não pode ser desfeita."
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => { setDeleteConfirm(null); }}
      />
    </div>
  )
}
