"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ChevronLeft, ChevronRight, PackagePlus } from "lucide-react"
import { fetchCategories, fetchPublicTeams, uploadImage, type AdminProduct, type Category, type PaginationMeta, type Team } from "@/lib/api"
import { useAdminApi } from "@/lib/use-admin-api"
import { getAdminLowStockVariants } from "@/lib/admin-low-stock"
import { Button } from "@/components/ui/button"
import { ConfirmDialog, ProductFormDialog } from "./product-form-dialog"
import { ProductFilters, ProductListSection } from "./product-list-section"
import { ProductStockSection } from "./product-stock-section"
import { emptyForm, LOW_STOCK_THRESHOLD, STEPS, getSizes, type ProductFormData } from "./admin-products-types"
import { revalidateCatalog } from "./actions"

const PAGE_SIZE = 20

function normalizeImageUrls(values: Array<string | undefined>) {
  return Array.from(new Set(values.map(value => value?.trim()).filter(Boolean) as string[]))
}

function parseMoney(value: string) {
  return parseFloat(value.replace(",", "."))
}

function getCsvValue(value: string | number) {
  return String(value).replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] || char)
}

function tryJsonParse(value: string) {
  try { return JSON.parse(value) } catch { return undefined }
}

export default function AdminProductsPage() {
  const { authedFetch } = useAdminApi()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const userEmail = session?.user?.email
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<PaginationMeta>({ page: 0, size: PAGE_SIZE, total: 0, totalPages: 0 })
  const [lowStockCount, setLowStockCount] = useState(0)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [teamFilter, setTeamFilter] = useState("")
  const [stockOnly, setStockOnly] = useState(false)
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Debounce search input so we don't hit the API on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(id)
  }, [search])

  const loadData = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        q: debouncedSearch,
        category: categoryFilter,
        team: teamFilter,
        lowStock: String(lowStockOnly),
      })
      const [pData, cData, tData, summary] = await Promise.all([
        authedFetch(`/admin/products?${params}`).catch(err => {
          console.error("Failed to load admin products", err)
          return null
        }),
        fetchCategories(),
        fetchPublicTeams(100),
        authedFetch("/admin/products/summary?lowStockThreshold=5&lowStockLimit=1000").catch(() => null),
      ])
      if (pData) {
        setProducts(pData.data as AdminProduct[])
        setMeta((pData.meta ?? { page: 0, size: PAGE_SIZE, total: 0, totalPages: 0 }) as PaginationMeta)
      }
      setCategories(cData.data)
      setTeams(tData.data)
      const summaryData = summary as { data?: { lowStockVariants?: unknown[] } } | null
      setLowStockCount(summaryData?.data?.lowStockVariants?.length ?? 0)
    } catch (err) {
      console.error("Failed to load data", err)
    } finally {
      setLoading(false)
    }
  }, [authedFetch, debouncedSearch, categoryFilter, teamFilter, lowStockOnly])

  // Reload when filters/search/page change. Filters reset to page 0.
  useEffect(() => {
    void loadData(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, categoryFilter, teamFilter, lowStockOnly])

  const goToPage = useCallback((page: number) => {
    void loadData(page)
  }, [loadData])

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

  const featuredCount = products.filter(product => product.featured).length
  const lowStockVariants = getAdminLowStockVariants(products, LOW_STOCK_THRESHOLD)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setStep(0)
    setError("")
    setDialogOpen(true)
  }

  const openEdit = (product: AdminProduct, initialStep = 0) => {
    const imageUrls = normalizeImageUrls([...(product.images || []), product.imageUrl])
    const sizeCategory = product.sizeCategory || "ADULTO"
    const sizes = getSizes(sizeCategory)
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
      featured: Boolean(product.featured),
      sizeCategory,
      variants: Object.fromEntries(sizes.map(size => [size, String(product.variants.find(v => v.size === size)?.stockQuantity ?? 0)])),
      customizationEnabled: Boolean(product.customizationEnabled),
      customizationTemplatePng: product.customizationTemplatePng || "",
      customizationTemplateMetadata: product.customizationTemplateMetadata ? JSON.stringify(product.customizationTemplateMetadata, null, 2) : "",
    })
    setStep(initialStep)
    setError("")
    setDialogOpen(true)
  }

  const validateStep = (currentStep: number) => {
    setError("")
    if (currentStep === 0) {
      if (!form.modelName.trim()) { setError("Nome é obrigatório"); return false }
      if (!form.description.trim()) { setError("Descrição é obrigatória"); return false }
      if (!form.categorySlug) { setError("Selecione uma categoria"); return false }
      if (!form.teamSlug) { setError("Selecione um time"); return false }
    }
    if (currentStep === 1) {
      const price = parseMoney(form.price)
      const originalPrice = form.originalPrice ? parseMoney(form.originalPrice) : undefined
      const sizes = getSizes(form.sizeCategory)
      const hasStock = sizes.some(size => parseInt(form.variants[size] || "0") > 0)
      if (!price || price <= 0) { setError("Preço inválido"); return false }
      if (originalPrice && originalPrice > 0 && price > originalPrice) { setError("Preço atual não pode ser maior que o preço original"); return false }
      if (!hasStock) { setError("Adicione estoque em pelo menos um tamanho"); return false }
    }
    if (currentStep === 2 && form.imageUrls.length === 0) { setError("Adicione pelo menos uma imagem"); return false }
    return true
  }

  const handleImageFiles = async (files: FileList | null) => {
    const selectedFiles = Array.from(files || [])
    if (selectedFiles.length === 0) return
    if (!userId) { setError("Sessão expirada, faça login novamente"); return }
    setUploadingImage(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of selectedFiles) uploadedUrls.push((await uploadImage(file, { userId, email: userEmail ?? undefined })).data.url)
      setForm(current => {
        const imageUrls = normalizeImageUrls([...current.imageUrls, ...uploadedUrls])
        return { ...current, imageUrl: imageUrls.join("\n"), imageUrls }
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!validateStep(step)) return
    setSaving(true)
    try {
      const imageUrls = normalizeImageUrls(form.imageUrls)
      const originalPrice = form.originalPrice ? parseMoney(form.originalPrice) : undefined
      const sizes = getSizes(form.sizeCategory)
      const payload = {
        categorySlug: form.categorySlug,
        teamSlug: form.teamSlug,
        modelName: form.modelName.trim(),
        description: form.description.trim(),
        price: parseMoney(form.price),
        originalPrice: originalPrice && originalPrice > 0 ? originalPrice : undefined,
        imageUrl: imageUrls[0],
        images: imageUrls,
        customizationEnabled: form.customizationEnabled,
        customizationTemplatePng: form.customizationTemplatePng.trim() || undefined,
        customizationTemplateMetadata: form.customizationTemplateMetadata.trim() ? tryJsonParse(form.customizationTemplateMetadata) : undefined,
        featured: form.featured,
        sizeCategory: form.sizeCategory,
        variants: sizes.filter(size => parseInt(form.variants[size] || "0") > 0).map(size => ({ size, stockQuantity: parseInt(form.variants[size] || "0") })),
      }
      if (editingId) await authedFetch(`/admin/products/${editingId}`, { method: "PUT", body: JSON.stringify(payload) })
      else await authedFetch("/admin/products", { method: "POST", body: JSON.stringify(payload) })
      await revalidateCatalog()
      setDialogOpen(false)
      await loadData(meta.page)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto")
    } finally {
      setSaving(false)
    }
  }

  const openLowStockReport = async () => {
    try {
      const summary = await authedFetch("/admin/products/summary?lowStockThreshold=5&lowStockLimit=1000")
      const rows = ((summary as { data?: { lowStockVariants?: Array<{ productId: string; productName: string; size: string; stockQuantity: number }> } }).data?.lowStockVariants) ?? []
      if (rows.length === 0) return
      const generatedAt = new Date().toLocaleString("pt-BR")
      const reportWindow = window.open("", "_blank")
      if (!reportWindow) return
      reportWindow.document.write(`<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatório de estoque baixo</title>
          <style>
            body { color: #10233f; font-family: Arial, sans-serif; margin: 32px; }
            h1 { font-size: 22px; margin: 0 0 6px; }
            p { color: #64748b; font-size: 12px; margin: 0 0 18px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border-bottom: 1px solid #d9e2ef; font-size: 12px; padding: 10px 8px; text-align: left; }
            th { background: #f4f7fb; color: #0f274d; font-size: 11px; text-transform: uppercase; }
            .stock { color: #c3222a; font-weight: 700; text-align: center; }
            .center { text-align: center; }
            @media print { body { margin: 18mm; } button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="float:right;padding:10px 16px;border-radius:999px;border:1px solid #d9e2ef;background:white;font-weight:700;cursor:pointer">Imprimir / Salvar PDF</button>
          <h1>Relatório de estoque baixo</h1>
          <p>Gerado em ${getCsvValue(generatedAt)}. Itens abaixo de ${LOW_STOCK_THRESHOLD} unidades ou com estoque zerado.</p>
          <table>
            <thead><tr><th>Produto</th><th class="center">Tamanho</th><th class="center">Estoque</th></tr></thead>
            <tbody>${rows.map(row => `<tr><td>${getCsvValue(row.productName)}</td><td class="center">${getCsvValue(row.size)}</td><td class="stock">${getCsvValue(row.stockQuantity)} un.</td></tr>`).join("")}</tbody>
          </table>
          <script>window.onload = () => window.print()</script>
        </body>
      </html>`)
      reportWindow.document.close()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao gerar relatório")
    }
  }

  if (loading && products.length === 0) return <div className="space-y-6 py-8"><p>Carregando...</p></div>

  const currentPage = meta.page
  const totalPages = meta.totalPages

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <div className="mt-2 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <h1 className="text-2xl font-bold">Produtos</h1>
            <p className="mt-1 text-sm text-slate-500">{meta.total} produto(s) no total</p>
          </div>
        </div>
        <Button className="inline-flex items-center gap-2" onClick={openCreate}><PackagePlus className="h-4 w-4" />Novo Produto</Button>
      </div>

      <ProductFilters search={search} categoryFilter={categoryFilter} teamFilter={teamFilter} stockOnly={stockOnly} lowStockOnly={lowStockOnly} categories={categories} teams={teams} lowStockCount={lowStockCount} onSearchChange={setSearch} onCategoryFilterChange={value => { setCategoryFilter(value); setTeamFilter("") }} onTeamFilterChange={setTeamFilter} onStockOnlyChange={() => { setStockOnly(value => lowStockOnly ? true : !value); setLowStockOnly(false) }} onLowStockOnlyChange={() => { setStockOnly(true); setLowStockOnly(true) }} onDownloadReport={openLowStockReport} onClearFilters={() => { setSearch(""); setCategoryFilter(""); setTeamFilter(""); setStockOnly(false); setLowStockOnly(false) }} />
      {stockOnly && <ProductStockSection products={products} lowStockVariants={lowStockVariants} lowStockOnly={lowStockOnly} onEditStock={product => { openEdit(product, 1); }} />}
      <ProductListSection products={products} onEdit={openEdit} onToggleActive={async product => { try { await authedFetch(`/admin/products/${product.id}/toggle-active`, { method: "PATCH" }); await revalidateCatalog(); await loadData(currentPage) } catch (err: unknown) { alert(err instanceof Error ? err.message : "Erro ao alterar status do produto") } }} onDeleteRequest={setDeleteConfirm} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)}><ChevronLeft className="h-4 w-4" />Anterior</Button>
          <span className="text-sm text-slate-600">Página {currentPage + 1} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages - 1} onClick={() => goToPage(currentPage + 1)}>Próxima<ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      <ProductFormDialog open={dialogOpen} editingId={editingId} form={form} step={step} saving={saving} uploadingImage={uploadingImage} error={error} categories={categories} teams={teams} featuredCount={featuredCount} onClose={() => setDialogOpen(false)} onBack={() => setStep(value => Math.max(value - 1, 0))} onNext={() => { if (validateStep(step)) setStep(value => Math.min(value + 1, STEPS.length - 1)) }} onSave={handleSave} onFormChange={setForm} onImageUrlTextChange={value => setForm(current => ({ ...current, imageUrl: value, imageUrls: normalizeImageUrls(value.split(/\r?\n/)) }))} onImageFiles={handleImageFiles} onRemoveImage={imageUrl => setForm(current => { const imageUrls = current.imageUrls.filter(value => value !== imageUrl); return { ...current, imageUrl: imageUrls.join("\n"), imageUrls } })} />
      <ConfirmDialog open={!!deleteConfirm} title="Excluir produto" message="Tem certeza que deseja desativar este produto?" onConfirm={async () => { if (!deleteConfirm) return; try { await authedFetch(`/admin/products/${deleteConfirm}`, { method: "DELETE" }); await revalidateCatalog(); setDeleteConfirm(null); await loadData(currentPage) } catch (err: unknown) { alert(err instanceof Error ? err.message : "Erro ao deletar produto") } }} onCancel={() => { setDeleteConfirm(null); }} />
    </div>
  )
}
