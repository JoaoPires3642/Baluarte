"use client"

import { useCallback, useEffect, useState } from "react"
import { FolderTree, Plus, Pencil, Search, Trash2, X, Users } from "lucide-react"
import { useAdminApi } from "@/lib/use-admin-api"
import { fetchTeamsByCategory, type Category, type Team } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
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

export default function AdminCategoriesPage() {
  const { authedFetch } = useAdminApi()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", displayOrder: 0, imageUrl: "", color: "" })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [teamsModal, setTeamsModal] = useState<{ category: Category; teams: Team[] } | null>(null)

  const loadData = useCallback(async () => {
    try {
      const data = await authedFetch("/admin/categories")
      setCategories(data.data || [])
    } catch (err) {
      console.error("Failed to load categories", err)
    } finally {
      setLoading(false)
    }
  }, [authedFetch])

  useEffect(() => { void loadData() }, [loadData])

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: "", slug: "", displayOrder: 0, imageUrl: "", color: "" })
    setError("")
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingId(cat.id)
    setForm({ name: cat.name, slug: cat.slug, displayOrder: cat.displayOrder || 0, imageUrl: cat.imageUrl || "", color: cat.color || "" })
    setError("")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Nome é obrigatório"); return }
    if (!form.slug.trim()) { setError("Slug é obrigatório"); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        displayOrder: form.displayOrder || 0,
        imageUrl: form.imageUrl.trim() || null,
        color: form.color.trim() || null,
      }
      if (editingId) {
        await authedFetch(`/admin/categories/${editingId}`, { method: "PUT", body: JSON.stringify(payload) })
      } else {
        await authedFetch("/admin/categories", { method: "POST", body: JSON.stringify(payload) })
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
      await authedFetch(`/admin/categories/${id}`, { method: "DELETE" })
      setDeleteConfirm(null)
      await loadData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao deletar")
    }
  }

  const openTeams = async (cat: Category) => {
    try {
      const res = await fetchTeamsByCategory(cat.slug)
      setTeamsModal({ category: cat, teams: res.data || [] })
    } catch {
      setTeamsModal({ category: cat, teams: [] })
    }
  }

  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="space-y-6 py-8"><p>Carregando...</p></div>
  }

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={openCreate} className="bg-[#0f274d]">
          <Plus className="h-4 w-4 mr-1" /> Nova Categoria
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar categorias..."
          value={search}
          onChange={e => { setSearch(e.target.value); }}
          className="pl-10"
        />
      </div>

      <div className="hidden sm:block">
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2"><FolderTree className="h-5 w-5 text-[#0f274d]" />Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium">Nome</th>
                  <th className="pb-3 text-left text-sm font-medium">Slug</th>
                  <th className="pb-3 text-left text-sm font-medium">Ordem</th>
                  <th className="pb-3 text-left text-sm font-medium">Status</th>
                  <th className="pb-3 text-right text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cat => (
                  <tr key={cat.id} className="border-b">
                    <td className="py-3 font-medium">{cat.name}</td>
                    <td className="py-3 text-sm text-slate-500">{cat.slug}</td>
                    <td className="py-3 text-sm text-slate-500">{cat.displayOrder ?? "-"}</td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cat.active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {cat.active !== false ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openTeams(cat)}>
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { openEdit(cat); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setDeleteConfirm(cat.id); }}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">Nenhuma categoria encontrada</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 sm:hidden">
        {filtered.map(cat => (
          <div key={cat.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold">{cat.name}</span>
                <p className="text-xs text-slate-500">{cat.slug}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {cat.active !== false ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openTeams(cat)}>
                <Users className="h-3.5 w-3.5 mr-1" /> Times
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { openEdit(cat); }}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-red-500" onClick={() => { setDeleteConfirm(cat.id); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-slate-500">Nenhuma categoria encontrada</p>
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); }}>
        <h2 className="text-lg font-bold mb-4">{editingId ? "Editar Categoria" : "Nova Categoria"}</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={e => {
              const name = e.target.value
              setForm(f => ({ ...f, name, slug: slugify(name) }))
            }} placeholder="Ex: Lançamentos" />
          </div>
          <div className="space-y-2">
            <Label>Ordem de exibição</Label>
            <Input type="number" min="0" value={form.displayOrder}
              onChange={e => { setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 })); }} />
          </div>
          <div className="space-y-2">
            <Label>URL da imagem de fundo</Label>
            <Input value={form.imageUrl} onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value })); }} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Cor de destaque (hex)</Label>
            <div className="flex gap-3">
              <Input value={form.color} onChange={e => { setForm(f => ({ ...f, color: e.target.value })); }} placeholder="#0f274d" maxLength={7} />
              {form.color && /^#[0-9a-fA-F]{6}$/.test(form.color) && (
                <span className="h-10 w-10 shrink-0 rounded-lg border" style={{ backgroundColor: form.color }} />
              )}
            </div>
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

      <Dialog open={!!teamsModal} onClose={() => { setTeamsModal(null); }}>
        <h2 className="text-lg font-bold mb-4">Times - {teamsModal?.category.name}</h2>
        {teamsModal?.teams.length === 0 && <p className="text-sm text-slate-500">Nenhum time encontrado</p>}
        <div className="space-y-2">
          {teamsModal?.teams.map(team => (
            <div key={team.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="font-medium">{team.name}</span>
              <span className="text-xs text-slate-400">{team.league || "-"}</span>
            </div>
          ))}
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir categoria?"
        message="Esta ação não pode ser desfeita."
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => { setDeleteConfirm(null); }}
      />
    </div>
  )
}
