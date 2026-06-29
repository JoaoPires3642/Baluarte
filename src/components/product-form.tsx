"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, MapPin, Sparkles, Truck, X } from "lucide-react"
import { useCart, type CartItem } from "@/context/cart-context"
import { useToast } from "@/context/toast-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { fetchShippingQuotes, type ModelDetail, type ShippingQuote } from "@/lib/api"

type ProductFormModel = ModelDetail & {
  sizes?: string[]
  name?: string
  image?: string
}

type ProductFormProps = {
  product: ModelDetail
}

const DEFAULT_SIZES = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"]

type CustomizationMetadata = {
  maxNameLength?: number
  maxNumberLength?: number
  customNamePrice?: number
  customNumberPrice?: number
  front?: { x?: number; y?: number; width?: number; height?: number }
  back?: { x?: number; y?: number; width?: number; height?: number }
}

function clampPercent(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.min(100, Math.max(0, value))
}

function parseCustomizationMetadata(rawMetadata?: string): CustomizationMetadata | null {
  if (!rawMetadata) return null

  try {
    const parsed = JSON.parse(rawMetadata) as CustomizationMetadata
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const { items, addItem } = useCart()
  const { showToast } = useToast()
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false)
  const [personalizationMobileOpen, setPersonalizationMobileOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customNumber, setCustomNumber] = useState("")
  const [personalizationConfirmed, setPersonalizationConfirmed] = useState(false)
  const [showMobileSizeSheet, setShowMobileSizeSheet] = useState(false)

  const displayProduct = product as ProductFormModel
  const sizes = product.variants?.map((variant) => variant.size) || displayProduct.sizes || DEFAULT_SIZES
  const customizationMetadata = useMemo(
    () => parseCustomizationMetadata(product.customizationTemplateMetadata),
    [product.customizationTemplateMetadata]
  )
  const canPersonalize = Boolean(product.customizationEnabled)
  const templatePreviewUrl = product.customizationTemplatePng || undefined
  const customNamePrice = customizationMetadata?.customNamePrice ?? 25
  const customNumberPrice = customizationMetadata?.customNumberPrice ?? 25
  const maxNameLength = customizationMetadata?.maxNameLength ?? 14
  const maxNumberLength = customizationMetadata?.maxNumberLength ?? 2
  const previewAnchor = customizationMetadata?.back || customizationMetadata?.front
  const previewTop = clampPercent(previewAnchor?.y, 26)
  const previewLeft = clampPercent(previewAnchor?.x, 50)
  const previewWidth = clampPercent(previewAnchor?.width, 52)

  const personalizationParts = [
    customName.trim() ? `Nome: ${customName.trim()}` : "",
    customNumber.trim() ? `Numero: ${customNumber.trim()}` : "",
  ].filter(Boolean)

  const customNameCount = customName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length

  const customNumberCount = customNumber.trim().length

  const personalizationLabel = personalizationParts.join(" | ")

  const personalizationExtra =
    (customNameCount * customNamePrice) +
    (customNumberCount * customNumberPrice)

  const finalPrice = Number(product.price) + (personalizationEnabled ? personalizationExtra : 0)
  const selectedVariant = product.variants?.find((variant) => variant.size === selectedSize)
  const selectedStockQuantity = selectedVariant?.stockQuantity
  const selectedCartQuantity = items.find((item) => item.id === product.id && item.size === selectedSize)?.quantity || 0

  const buildCartItem = (): CartItem => {
    const productName = product.modelName || displayProduct.name || "Produto"

    return {
      id: product.id,
      name: personalizationEnabled && personalizationLabel ? `${productName} (${personalizationLabel})` : productName,
      price: finalPrice,
      basePrice: Number(product.price),
      image: product.thumbnailUrl || product.imageUrl || displayProduct.image || product.images?.[0],
      teamName: product.teamSlug,
      size: selectedSize,
      quantity: 1,
      stockQuantity: selectedStockQuantity,
      customNames: personalizationEnabled && customName.trim() ? customName.trim().split(/\s+/).filter(Boolean) : [],
      customNumber: personalizationEnabled ? customNumber.trim() || undefined : undefined,
      customNamePrice: personalizationEnabled ? customNamePrice : undefined,
      customNumberPrice: personalizationEnabled ? customNumberPrice : undefined,
      personalizationConfirmed: personalizationEnabled && personalizationConfirmed,
    }
  }

  const canAddSelectedSize = () => {
    if (typeof selectedStockQuantity !== "number") return true
    if (selectedStockQuantity <= 0) {
      showToast("Tamanho sem estoque", "error")
      return false
    }
    if (selectedCartQuantity >= selectedStockQuantity) {
      showToast(`Estoque disponível para este tamanho: ${selectedStockQuantity}`, "error")
      return false
    }
    return true
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      setShowMobileSizeSheet(true)
      showToast("Selecione um tamanho", "error")
      return
    }

    if (!canAddSelectedSize()) return

    if (personalizationEnabled && !personalizationConfirmed) {
      showToast("Confirme o prazo de personalização antes de adicionar ao carrinho", "error")
      return
    }

    const item = buildCartItem()

    addItem(item)
    showToast("Produto adicionado ao carrinho!", "success")
  }

  const handleBuyNow = () => {
    if (!selectedSize) {
      setShowMobileSizeSheet(true)
      showToast("Selecione um tamanho", "error")
      return
    }

    if (!canAddSelectedSize()) return

    if (personalizationEnabled && !personalizationConfirmed) {
      showToast("Confirme o prazo de personalização antes de comprar", "error")
      return
    }

    const item = buildCartItem()

    addItem(item)
    router.push("/checkout")
  }

  const [showShippingCalc, setShowShippingCalc] = useState(false)
  const [shippingCep, setShippingCep] = useState("")
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingOptions, setShippingOptions] = useState<ShippingQuote[]>([])
  const [shippingError, setShippingError] = useState("")

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  const handleCalculateShipping = async () => {
    const digits = shippingCep.replace(/\D/g, "")
    if (digits.length !== 8) {
      setShippingError("CEP inválido")
      return
    }

    setShippingLoading(true)
    setShippingError("")
    setShippingOptions([])

    try {
      const res = await fetchShippingQuotes({ cep: digits, street: "", number: "", neighborhood: "", city: "", state: "" }, 1, personalizationEnabled)
      setShippingOptions(res.data.options)
    } catch (err) {
      setShippingError(err instanceof Error ? err.message : "Erro ao consultar frete")
    } finally {
      setShippingLoading(false)
    }
  }

  const personalizationPanel = (
    <>
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
        <div className="relative aspect-[4/5] bg-slate-100">
          {templatePreviewUrl ? (
            <Image src={templatePreviewUrl} alt={`Template de personalização de ${product.modelName}`} fill unoptimized className="object-contain" />
          ) : null}

          <div
            className="pointer-events-none absolute flex -translate-x-1/2 flex-col items-center text-center"
            style={{ top: `${previewTop}%`, left: `${previewLeft}%`, width: `${previewWidth}%` }}
          >
            {customName ? <p className="text-sm font-black uppercase tracking-[0.28em] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.55)] sm:text-base">{customName}</p> : null}
            {customNumber ? <p className="mt-2 text-4xl font-black leading-none tracking-[0.2em] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)] sm:text-6xl">{customNumber}</p> : null}
          </div>

          {!templatePreviewUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#10233f] to-[#0f274d] p-6 text-center text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Preview</p>
              {customName ? <p className="mt-4 text-lg font-black uppercase tracking-[0.28em]">{customName}</p> : null}
              {customNumber ? <p className="mt-3 text-5xl font-black tracking-[0.2em]">{customNumber}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-[#10233f]">Preview da personalização</p>
          <p className="mt-1 text-xs text-slate-500">Nome, número e base visual aparecem juntos para facilitar a decisão no mobile.</p>
        </div>
      </div>

      <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
        <div className="rounded-2xl border border-[#e6edf6] bg-[#f8fbff] p-3 text-xs text-slate-600">
          <p>Nome: até {maxNameLength} caracteres</p>
          <p>Número: até {maxNumberLength} dígitos</p>
          <p>Preço nome: R$ {customNamePrice.toFixed(2).replace(".", ",")}</p>
          <p>Preço número: R$ {customNumberPrice.toFixed(2).replace(".", ",")}</p>
        </div>

        <div className="space-y-2">
          <Label>Nome na camisa</Label>
          <Input
            placeholder="Ex: JOAO"
            maxLength={maxNameLength}
            value={customName}
            onChange={(e) => setCustomName(e.target.value.toUpperCase())}
          />
          <p className="text-xs text-muted-foreground">+ R$ {customNamePrice.toFixed(2).replace(".", ",")} por nome</p>
        </div>

        <div className="space-y-2">
          <Label>Número</Label>
          <Input
            placeholder="Ex: 10"
            maxLength={maxNumberLength}
            value={customNumber}
            onChange={(e) => setCustomNumber(e.target.value.replace(/\D/g, "").slice(0, maxNumberLength))}
          />
          <p className="text-xs text-muted-foreground">+ R$ {customNumberPrice.toFixed(2).replace(".", ",")} por número</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <p>Nomes: {customNameCount} x R$ {customNamePrice.toFixed(2).replace(".", ",")}</p>
          <p>Números: {customNumberCount} x R$ {customNumberPrice.toFixed(2).replace(".", ",")}</p>
          <p className="mt-2 font-semibold text-[#10233f]">Adicional: R$ {personalizationExtra.toFixed(2).replace(".", ",")}</p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm">
          <input
            type="checkbox"
            checked={personalizationConfirmed}
            onChange={(e) => setPersonalizationConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#c3222a]"
          />
          <span className="leading-relaxed text-amber-900">
            Estou ciente de que a personalização pode levar <strong>até 7 dias úteis</strong> para ser produzida, além do prazo de entrega do frete.
          </span>
        </label>

        <div className="sm:hidden">
          <Button className="w-full" onClick={() => setPersonalizationMobileOpen(false)}>
            Aplicar personalização
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <Separator />

      <div className="hidden space-y-3 sm:block">
        <Label>Tamanho *</Label>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const variant = product.variants?.find((item) => item.size === size)
            const withoutStock = typeof variant?.stockQuantity === "number" && variant.stockQuantity <= 0

            return (
              <Button
                key={size}
                variant={selectedSize === size ? "default" : "outline"}
                className="w-12"
                disabled={withoutStock}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="sm:hidden">
        <button type="button" onClick={() => setShowMobileSizeSheet(true)} className="flex w-full items-center justify-between rounded-[1.25rem] border border-slate-200 bg-white p-4 text-left">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tamanho</p>
            <p className="mt-1 text-base font-semibold text-[#10233f]">{selectedSize || "Escolher tamanho"}</p>
          </div>
          <span className="text-sm font-semibold text-[#0f274d]">Alterar</span>
        </button>
      </div>

      {canPersonalize ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <button
            type="button"
            onClick={() => {
              setPersonalizationEnabled((current) => {
                const next = !current
                if (next) setPersonalizationMobileOpen(true)
                if (!next) setPersonalizationMobileOpen(false)
                return next
              })
            }}
            className={`flex w-full items-start justify-between gap-4 rounded-[1.25rem] border p-4 text-left transition-all ${personalizationEnabled ? "border-[#0f274d] bg-white shadow-sm" : "border-slate-200 bg-white/80 hover:border-[#0f274d]/30 hover:bg-white"}`}
          >
            <div>
              <Label className="inline-flex items-center gap-2 cursor-pointer"><Sparkles className="h-4 w-4 text-[#c3222a]" /> Personalizar camisa</Label>
              <p className="mt-1 text-xs text-slate-500">Ative para adicionar nome e número com preview visual antes da compra.</p>
            </div>
            <span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${personalizationEnabled ? "bg-[#0f274d]" : "bg-slate-300"}`}>
              <span className={`flex h-4 w-4 rounded-full bg-white transition-transform ${personalizationEnabled ? "translate-x-5" : "translate-x-0"}`}>
                {personalizationEnabled ? <Check className="m-auto h-3 w-3 text-[#0f274d]" /> : null}
              </span>
            </span>
          </button>

          {personalizationEnabled ? (
            <>
              <div className="mt-4 hidden gap-4 sm:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                {personalizationPanel}
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-[#e6edf6] bg-white p-4 sm:hidden">
                <p className="text-sm font-semibold text-[#10233f]">Personalização ativa</p>
                <p className="mt-1 text-xs text-slate-500">Abra o editor para preencher e revisar o preview sem alongar a página.</p>
                <Button variant="outline" className="mt-4 w-full" onClick={() => setPersonalizationMobileOpen(true)}>
                  Abrir editor de personalização
                </Button>
              </div>

              {personalizationMobileOpen ? (
                <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/55 backdrop-blur-sm sm:hidden">
                  <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-4 shadow-2xl">
                    <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold text-[#10233f]">Editor de personalização</p>
                        <p className="mt-1 text-sm text-slate-500">Configure nome, número e visualize antes de adicionar ao carrinho.</p>
                      </div>
                      <button type="button" onClick={() => setPersonalizationMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-4">{personalizationPanel}</div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-slate-500">Preco final</span>
          <span className="text-2xl font-extrabold text-[#102a5c]">R$ {(Number(product.price) + (personalizationEnabled ? personalizationExtra : 0)).toFixed(2).replace(".", ",")}</span>
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setShowShippingCalc(!showShippingCalc)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Truck className="h-4 w-4 text-[#c3222a]" />
            Calcular frete
          </span>
          <span className={`text-sm text-slate-400 transition-transform ${showShippingCalc ? "rotate-180" : ""}`}>▼</span>
        </button>

        {showShippingCalc && (
          <div className="border-t border-slate-100 p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="CEP"
                  className="pl-9"
                  value={shippingCep}
                  onChange={e => setShippingCep(formatCep(e.target.value))}
                  maxLength={9}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleCalculateShipping}
                disabled={shippingLoading}
                className="shrink-0"
              >
                {shippingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calcular"}
              </Button>
            </div>

            {shippingError && (
              <p className="mt-2 text-xs text-red-500">{shippingError}</p>
            )}

            {shippingOptions.length > 0 && (
              <div className="mt-3 space-y-2">
                {shippingOptions.map(opt => (
                  <div key={opt.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-500">{opt.estimatedDays}</p>
                    </div>
                    <span className="text-sm font-bold text-[#102a5c]">
                      R$ {opt.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden flex-col gap-3 sm:flex sm:flex-row">
        <Button size="lg" className="flex-1" onClick={handleAddToCart}>
          Adicionar ao Carrinho
        </Button>
        <Button size="lg" variant="outline" className="sm:min-w-[180px]" onClick={handleBuyNow}>
          Comprar Agora
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#d9e2ef] bg-white/95 p-4 backdrop-blur sm:hidden">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Total</p>
            <p className="truncate text-lg font-extrabold text-[#102a5c]">R$ {(Number(product.price) + (personalizationEnabled ? personalizationExtra : 0)).toFixed(2).replace(".", ",")}</p>
          </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" variant="outline" className="w-full" onClick={handleBuyNow}>
              Comprar agora
            </Button>
            <Button size="lg" className="w-full" onClick={handleAddToCart}>
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {showMobileSizeSheet ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/55 backdrop-blur-sm sm:hidden">
          <div className="w-full rounded-t-[2rem] bg-white p-4 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-[#10233f]">Escolha o tamanho</p>
                <p className="mt-1 text-sm text-slate-500">Selecione antes de adicionar ao carrinho.</p>
              </div>
              <button type="button" onClick={() => setShowMobileSizeSheet(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const variant = product.variants?.find((item) => item.size === size)
                const withoutStock = typeof variant?.stockQuantity === "number" && variant.stockQuantity <= 0

                return (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    className="min-w-[64px]"
                    disabled={withoutStock}
                    onClick={() => {
                      setSelectedSize(size)
                      setShowMobileSizeSheet(false)
                    }}
                  >
                    {size}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
