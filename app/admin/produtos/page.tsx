"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { Camera, Check, ChevronLeft, ChevronRight, Eye, EyeOff, FolderOpen, PackagePlus, Pencil, Search, Trash2, X } from "lucide-react"
import { fetchCategories, fetchTeamsByCategory, uploadImage, type Category, type Team, type AdminProduct } from "@/lib/api"
import { useAdminApi } from "@/lib/use-admin-api"
import { resolveMediaUrl } from "@/lib/media"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const SIZES = ["P", "M", "G", "GG"]
const STEPS = ["Informações", "Preço & Estoque", "Imagem"]

function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-[100] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-white p-6 shadow-2xl">
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
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
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

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => {
          const done = i < step
          const current = i === step
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-green-500 text-white" : current ? "bg-[#0f274d] text-white" : "bg-slate-100 text-slate-400"
              }`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-sm sm:inline ${current ? "font-semibold text-[#0f274d]" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex gap-1">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#0f274d]" : "bg-slate-200"}`} />
        ))}
      </div>
    </div>
  )
}

type FormData = {
  modelName: string
  description: string
  price: string
  originalPrice: string
  categorySlug: string
  teamSlug: string
  imageUrl: string
  imageUrls: string[]
  variants: Record<string, string>
}

const emptyForm: FormData = {
  modelName: "",
  description: "",
  price: "",
  originalPrice: "",
  categorySlug: "",
  teamSlug: "",
  imageUrl: "",
  imageUrls: [],
  variants: { P: "0", M: "0", G: "0", GG: "0" },
}

function normalizeImageUrls(values: Array<string | undefined>) {
  return Array.from(new Set(values.map(value => value?.trim()).filter(Boolean) as string[]))
}

function parseMoney(value: string) {
  return parseFloat(value.replace(",", "."))
}

export default function AdminProductsPage() {
  const { authedFetch } = useAdminApi()
  const { getToken, userId } = useAuth()
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [pData, cData] = await Promise.all([
        authedFetch("/admin/products").catch(err => {
          console.error("Failed to load admin products", err)
          return null as unknown as { data: AdminProduct[] }
        }),
        fetchCategories(),
      ])
      if (pData) setProducts(pData.data)
      setCategories(cData.data)
      const allTeams: Team[] = []
      for (const cat of cData.data) {
        try { const t = await fetchTeamsByCategory(cat.slug); allTeams.push(...t.data) } catch { /* skip */ }
      }
      setTeams(allTeams)
    } catch (err) {
      console.error("Failed to load data", err)
    } finally {
      setLoading(false)
    }
  }, [authedFetch])

  useEffect(() => { loadData() }, [loadData])

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (loading || products.length === 0) return
    const editId = searchParams.get("editId")
    if (!editId) return
    const product = products.find(p => p.id === editId)
    if (product) {
      openEdit(product)
      router.replace("/admin/produtos")
    }
  }, [loading, products, searchParams, router])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setStep(0)
    setError("")
    setDialogOpen(true)
  }

  const openEdit = (product: AdminProduct) => {
    const imageUrls = normalizeImageUrls([...(product.images || []), product.imageUrl])
    setEditingId(product.id)
    setForm({
      modelName: product.modelName,
      description: product.description || "",
      price: product.price.toString().replace(".", ","),
      originalPrice: product.originalPrice ? product.originalPrice.toString().replace(".", ",") : "",
      categorySlug: product.categorySlug,
      teamSlug: product.teamSlug,
      imageUrl: imageUrls.join("\n"),
      imageUrls,
      variants: {
        P: String(product.variants.find(v => v.size === "P")?.stockQuantity ?? 0),
        M: String(product.variants.find(v => v.size === "M")?.stockQuantity ?? 0),
        G: String(product.variants.find(v => v.size === "G")?.stockQuantity ?? 0),
        GG: String(product.variants.find(v => v.size === "GG")?.stockQuantity ?? 0),
      },
    })
    setStep(0)
    setError("")
    setDialogOpen(true)
  }

  const validateStep = (s: number): boolean => {
    setError("")
    if (s === 0) {
      if (!form.modelName.trim()) { setError("Nome é obrigatório"); return false }
      if (!form.description.trim()) { setError("Descrição é obrigatória"); return false }
      if (!form.categorySlug) { setError("Selecione uma categoria"); return false }
      if (!form.teamSlug) { setError("Selecione um time"); return false }
      return true
    }
    if (s === 1) {
      const price = parseMoney(form.price)
      if (!price || price <= 0) { setError("Preço inválido"); return false }
      const originalPrice = form.originalPrice ? parseMoney(form.originalPrice) : undefined
      if (originalPrice && originalPrice > 0 && price > originalPrice) { setError("Preço atual não pode ser maior que o preço original"); return false }
      const hasStock = SIZES.some(s => parseInt(form.variants[s] || "0") > 0)
      if (!hasStock) { setError("Adicione estoque em pelo menos um tamanho"); return false }
      return true
    }
    if (s === 2) {
      if (form.imageUrls.length === 0) { setError("Adicione pelo menos uma imagem"); return false }
      return true
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 2))
  }

  const handleBack = () => setStep(s => Math.max(s - 1, 0))

  const handleImageUrlTextChange = (value: string) => {
    setForm(f => ({ ...f, imageUrl: value, imageUrls: normalizeImageUrls(value.split(/\r?\n/)) }))
  }

  const handleImageFiles = async (files: FileList | null) => {
    const selectedFiles = Array.from(files || [])
    if (selectedFiles.length === 0) return

    const token = await getToken()
    if (!token) { setError("Sessão expirada, faça login novamente"); return }
    setUploadingImage(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of selectedFiles) {
        const res = await uploadImage(file, {
          token,
          userId: userId || "",
          email: userEmail,
        })
        uploadedUrls.push(res.data.url)
      }
      setForm(f => {
        const imageUrls = normalizeImageUrls([...f.imageUrls, ...uploadedUrls])
        return { ...f, imageUrl: imageUrls.join("\n"), imageUrls }
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload")
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (imageUrl: string) => {
    setForm(f => {
      const imageUrls = f.imageUrls.filter(value => value !== imageUrl)
      return { ...f, imageUrl: imageUrls.join("\n"), imageUrls }
    })
  }

  const handleSave = async () => {
    if (!validateStep(step)) return

    setSaving(true)
    try {
      const price = parseMoney(form.price)
      const originalPrice = form.originalPrice ? parseMoney(form.originalPrice) : undefined
      const imageUrls = normalizeImageUrls(form.imageUrls)
      const variants = SIZES
        .filter(s => parseInt(form.variants[s] || "0") > 0)
        .map(s => ({ size: s, stockQuantity: parseInt(form.variants[s] || "0") }))
      const payload = {
        categorySlug: form.categorySlug,
        teamSlug: form.teamSlug,
        modelName: form.modelName.trim(),
        description: form.description.trim(),
        price,
        originalPrice: originalPrice && originalPrice > 0 ? originalPrice : undefined,
        imageUrl: imageUrls[0],
        images: imageUrls,
        customizationEnabled: false,
        variants,
      }

      if (editingId) {
        await authedFetch(`/admin/products/${editingId}`, { method: "PUT", body: JSON.stringify(payload) })
      } else {
        await authedFetch("/admin/products", { method: "POST", body: JSON.stringify(payload) })
      }
      setDialogOpen(false)
      await loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await authedFetch(`/admin/products/${id}`, { method: "DELETE" })
      setDeleteConfirm(null)
      await loadData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao deletar produto")
    }
  }

  const handleToggleActive = async (product: AdminProduct) => {
    try {
      await authedFetch(`/admin/products/${product.id}/toggle-active`, { method: "PATCH" })
      await loadData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao alterar status do produto")
    }
  }

  const filtered = products.filter(p =>
    !search || p.modelName.toLowerCase().includes(search.toLowerCase()) || p.teamSlug.includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="space-y-6 py-8"><p>Carregando...</p></div>
  }

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <div className="mt-2 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <p className="eyebrow">Admin produtos</p>
            <h1 className="mt-4 text-2xl font-bold">Produtos</h1>
            <p className="text-muted-foreground mt-2">Gerencie seu catálogo</p>
          </div>
        </div>
        <Button className="inline-flex items-center gap-2" onClick={openCreate}>
          <PackagePlus className="h-4 w-4" />Novo Produto
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Buscar produto..." className="max-w-sm pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{filtered.length} produto(s)</CardTitle></CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium">Produto</th>
                  <th className="pb-3 text-left text-sm font-medium">Time</th>
                  <th className="pb-3 text-left text-sm font-medium">Preço</th>
                  <th className="pb-3 text-left text-sm font-medium">Estoque</th>
                  <th className="pb-3 text-left text-sm font-medium">Status</th>
                  <th className="pb-3 text-right text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="border-b">
                    <td className="py-3">{product.modelName}</td>
                    <td className="py-3">{product.teamSlug}</td>
                    <td className="py-3">R$ {product.price.toFixed(2).replace(".", ",")}</td>
                    <td className="py-3">
                      <span className={product.stockQuantity < 10 ? "text-red-500 font-medium" : ""}>{product.stockQuantity}</span>
                    </td>
                    <td className="py-3">
                      <Badge variant={product.active ? "success" : "secondary"}>{product.active ? "Ativo" : "Inativo"}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(product)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(product)}>
                          {product.active ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-green-500" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteConfirm(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">Nenhum produto encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {filtered.map(product => (
              <div key={product.id} className="rounded-xl border border-slate-100 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{product.modelName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{product.teamSlug}</p>
                  </div>
                  <Badge variant={product.active ? "success" : "secondary"} className="shrink-0 text-[10px]">{product.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-4 text-sm">
                    <span>R$ {product.price.toFixed(2).replace(".", ",")}</span>
                    <span className={product.stockQuantity < 10 ? "text-red-500 font-medium" : ""}>
                      Est: {product.stockQuantity}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(product)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(product)}>
                      {product.active ? <EyeOff className="h-3.5 w-3.5 text-slate-400" /> : <Eye className="h-3.5 w-3.5 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteConfirm(product.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-slate-500">Nenhum produto encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <h2 className="text-xl font-bold mb-4">{editingId ? "Editar Produto" : "Novo Produto"}</h2>
        <ProgressBar step={step} />

        {/* Step 1 - Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Produto</Label>
              <Input value={form.modelName} onChange={e => setForm(f => ({ ...f, modelName: e.target.value }))} placeholder="Ex: Camisa São Paulo 2025/26 Home" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição do produto..." rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select value={form.categorySlug} onChange={e => setForm(f => ({ ...f, categorySlug: e.target.value, teamSlug: "" }))}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <select value={form.teamSlug} onChange={e => setForm(f => ({ ...f, teamSlug: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" disabled={!form.categorySlug}>
                  <option value="">Selecione...</option>
                  {teams.filter(t => t.categorySlug === form.categorySlug).map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 - Price & Stock */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="299,90" />
              </div>
              <div className="space-y-2">
                <Label>Preço Original (R$)</Label>
                <Input value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="349,90" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estoque por Tamanho</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SIZES.map(size => (
                  <div key={size} className="space-y-1">
                    <span className="text-xs font-medium text-slate-500">{size}</span>
                    <Input value={form.variants[size]} onChange={e => setForm(f => ({ ...f, variants: { ...f.variants, [size]: e.target.value } }))}
                      type="number" min="0" placeholder="0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 - Image */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URLs das Imagens</Label>
              <Textarea value={form.imageUrl} onChange={e => handleImageUrlTextChange(e.target.value)} placeholder="https://...\nhttps://..." rows={3} />
              <p className="text-xs text-slate-500">Use uma URL por linha. A primeira imagem será a capa.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-sm font-medium text-slate-600 hover:border-[#0f274d] hover:text-[#0f274d] transition-colors">
                <Camera className="h-5 w-5 shrink-0" />
                <span className="truncate">Câmera</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleImageFiles(e.target.files)} />
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-sm font-medium text-slate-600 hover:border-[#0f274d] hover:text-[#0f274d] transition-colors">
                <FolderOpen className="h-5 w-5 shrink-0" />
                <span className="truncate">Arquivos</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageFiles(e.target.files)} />
              </label>
            </div>

            {uploadingImage && <p className="text-sm text-slate-500">Enviando imagem...</p>}

            {form.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {form.imageUrls.map((imageUrl, index) => (
                  <div key={imageUrl} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <Image src={resolveMediaUrl(imageUrl) || imageUrl} alt={`Preview ${index + 1}`} width={240} height={128} unoptimized className="h-32 w-full object-contain" />
                    <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {index === 0 ? "Capa" : index + 1}
                    </div>
                    <button type="button" onClick={() => removeImage(imageUrl)} className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-500 hover:text-red-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-2">
          {step > 0 ? (
            <Button variant="outline" size="sm" onClick={handleBack} disabled={saving} className="text-xs sm:text-sm">
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5 sm:mr-1" /> <span className="hidden xs:inline sm:inline">Voltar</span>
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving} className="text-xs sm:text-sm">
              Cancelar
            </Button>
            {step < 2 ? (
              <Button size="sm" onClick={handleNext} className="text-xs sm:text-sm">
                Avançar <ChevronRight className="h-3.5 w-3.5 ml-0.5 sm:ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs sm:text-sm">
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
              </Button>
            )}
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir produto"
        message="Tem certeza que deseja desativar este produto?"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
