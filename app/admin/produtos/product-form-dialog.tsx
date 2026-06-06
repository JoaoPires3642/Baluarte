import Image from "next/image"
import { Camera, Check, ChevronLeft, ChevronRight, FolderOpen, X } from "lucide-react"
import type { Category, Team } from "@/lib/api"
import { resolveMediaUrl } from "@/lib/media"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProductFormData, SIZES, STEPS } from "./admin-products-types"

type ProductFormDialogProps = {
  open: boolean
  editingId: string | null
  form: ProductFormData
  step: number
  saving: boolean
  uploadingImage: boolean
  error: string
  categories: Category[]
  teams: Team[]
  featuredCount: number
  onClose: () => void
  onBack: () => void
  onNext: () => void
  onSave: () => void
  onFormChange: (updater: (form: ProductFormData) => ProductFormData) => void
  onImageUrlTextChange: (value: string) => void
  onImageFiles: (files: FileList | null) => void
  onRemoveImage: (imageUrl: string) => void
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }: {
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

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => {
          const done = i < step
          const current = i === step
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-green-500 text-white" : current ? "bg-[#0f274d] text-white" : "bg-slate-100 text-slate-400"}`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-sm sm:inline ${current ? "font-semibold text-[#0f274d]" : "text-slate-400"}`}>{label}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex gap-1">
        {STEPS.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#0f274d]" : "bg-slate-200"}`} />)}
      </div>
    </div>
  )
}

export function ProductFormDialog(props: ProductFormDialogProps) {
  const { open, editingId, form, step, saving, uploadingImage, error, categories, teams, featuredCount, onClose, onBack, onNext, onSave, onFormChange, onImageUrlTextChange, onImageFiles, onRemoveImage } = props

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">{editingId ? "Editar Produto" : "Novo Produto"}</h2>
      <ProgressBar step={step} />

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nome do Produto</Label><Input value={form.modelName} onChange={e => onFormChange(f => ({ ...f, modelName: e.target.value }))} placeholder="Ex: Camisa São Paulo 2025/26 Home" /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => onFormChange(f => ({ ...f, description: e.target.value }))} placeholder="Descrição do produto..." rows={3} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select value={form.categorySlug} onChange={e => onFormChange(f => ({ ...f, categorySlug: e.target.value, teamSlug: "" }))} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <select value={form.teamSlug} onChange={e => onFormChange(f => ({ ...f, teamSlug: e.target.value }))} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" disabled={!form.categorySlug}>
                <option value="">Selecione...</option>
                {teams.filter(t => t.categorySlug === form.categorySlug).map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <input type="checkbox" checked={form.featured} disabled={!form.featured && featuredCount >= 10} onChange={e => onFormChange(f => ({ ...f, featured: e.target.checked }))} className="mt-1" />
            <span><span className="block font-semibold text-slate-800">Marcar como destaque</span><span className="block text-xs text-slate-500">{featuredCount}/10 produtos em destaque. Esses produtos aparecem na seção Destaque da home.</span></span>
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Preço (R$)</Label><Input value={form.price} onChange={e => onFormChange(f => ({ ...f, price: e.target.value }))} placeholder="299,90" /></div>
            <div className="space-y-2"><Label>Preço Original (R$)</Label><Input value={form.originalPrice} onChange={e => onFormChange(f => ({ ...f, originalPrice: e.target.value }))} placeholder="349,90" /></div>
          </div>
          <div className="space-y-2">
            <Label>Estoque por Tamanho</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SIZES.map(size => <div key={size} className="space-y-1"><span className="text-xs font-medium text-slate-500">{size}</span><Input value={form.variants[size]} onChange={e => onFormChange(f => ({ ...f, variants: { ...f.variants, [size]: e.target.value } }))} type="number" min="0" placeholder="0" /></div>)}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2"><Label>URLs das Imagens</Label><Textarea value={form.imageUrl} onChange={e => onImageUrlTextChange(e.target.value)} placeholder="https://...\nhttps://..." rows={3} /><p className="text-xs text-slate-500">Use uma URL por linha. A primeira imagem será a capa.</p></div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-sm font-medium text-slate-600 hover:border-[#0f274d] hover:text-[#0f274d] transition-colors"><Camera className="h-5 w-5 shrink-0" /><span className="truncate">Câmera</span><input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => onImageFiles(e.target.files)} /></label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-sm font-medium text-slate-600 hover:border-[#0f274d] hover:text-[#0f274d] transition-colors"><FolderOpen className="h-5 w-5 shrink-0" /><span className="truncate">Arquivos</span><input type="file" accept="image/*" multiple className="hidden" onChange={e => onImageFiles(e.target.files)} /></label>
          </div>
          {uploadingImage && <p className="text-sm text-slate-500">Enviando imagem...</p>}
          {form.imageUrls.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{form.imageUrls.map((imageUrl, index) => <div key={imageUrl} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><Image src={resolveMediaUrl(imageUrl) || imageUrl} alt={`Preview ${index + 1}`} width={240} height={128} unoptimized className="h-32 w-full object-contain" /><div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-700">{index === 0 ? "Capa" : index + 1}</div><button type="button" onClick={() => onRemoveImage(imageUrl)} className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-500 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></div>)}</div>}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <div className="mt-6 flex items-center justify-between gap-2">
        {step > 0 ? <Button variant="outline" size="sm" onClick={onBack} disabled={saving} className="text-xs sm:text-sm"><ChevronLeft className="h-3.5 w-3.5 mr-0.5 sm:mr-1" /> <span className="hidden xs:inline sm:inline">Voltar</span></Button> : <div />}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving} className="text-xs sm:text-sm">Cancelar</Button>
          {step < 2 ? <Button size="sm" onClick={onNext} className="text-xs sm:text-sm">Avançar <ChevronRight className="h-3.5 w-3.5 ml-0.5 sm:ml-1" /></Button> : <Button size="sm" onClick={onSave} disabled={saving} className="text-xs sm:text-sm">{saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}</Button>}
        </div>
      </div>
    </Dialog>
  )
}
