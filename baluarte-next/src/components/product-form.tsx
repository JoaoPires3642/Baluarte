"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart, type CartItem } from "@/context/cart-context"
import { useToast } from "@/context/toast-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { ModelDetail } from "@/lib/api"

type ProductFormModel = ModelDetail & {
  sizes?: string[]
  name?: string
  image?: string
}

type ProductFormProps = {
  product: ModelDetail
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [customName, setCustomName] = useState("")
  const [customNumber, setCustomNumber] = useState("")

  const displayProduct = product as ProductFormModel
  const sizes = product.variants?.map((variant) => variant.size) || displayProduct.sizes || ["P", "M", "G", "GG"]
  const canPersonalize = Boolean(product.customizationEnabled && product.customizationTemplatePng)

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
    (customNameCount * 25) +
    (customNumberCount * 25)

  const finalPrice = Number(product.price) + personalizationExtra

  const buildCartItem = (): CartItem => {
    const productName = product.modelName || displayProduct.name || "Produto"

    return {
      id: product.id,
      name: personalizationLabel ? `${productName} (${personalizationLabel})` : productName,
      price: finalPrice,
      basePrice: Number(product.price),
      image: product.thumbnailUrl || product.imageUrl || displayProduct.image || product.images?.[0],
      teamName: product.teamSlug,
      size: selectedSize,
      quantity: 1,
      customNames: customName.trim() ? customName.trim().split(/\s+/).filter(Boolean) : [],
      customNumber: customNumber.trim() || undefined,
    }
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast("Selecione um tamanho", "error")
      return
    }

    const item = buildCartItem()

    addItem(item)
    showToast("Produto adicionado ao carrinho!", "success")
  }

  const handleBuyNow = () => {
    if (!selectedSize) {
      showToast("Selecione um tamanho", "error")
      return
    }

    const item = buildCartItem()

    addItem(item)
    router.push("/checkout")
  }

  return (
    <>
      <Separator />

      <div className="space-y-3">
        <Label>Tamanho *</Label>
        <div className="flex gap-2">
          {sizes.map((size) => (
            <Button
              key={size}
              variant={selectedSize === size ? "default" : "outline"}
              className="w-12"
              onClick={() => setSelectedSize(size)}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {canPersonalize ? (
        <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div>
            <Label>Personalizacao</Label>
            <p className="mt-1 text-xs text-muted-foreground">Produto compativel com nome e numero personalizados.</p>
          </div>

          <div className="space-y-2">
            <Label>Nome na camisa</Label>
            <Input
              placeholder="Ex: JOAO"
              maxLength={14}
              value={customName}
              onChange={(e) => setCustomName(e.target.value.toUpperCase())}
            />
            <p className="text-xs text-muted-foreground">+ R$ 25,00 por nome</p>
          </div>

          <div className="space-y-2">
            <Label>Numero</Label>
            <Input
              placeholder="Ex: 10"
              maxLength={2}
              value={customNumber}
              onChange={(e) => setCustomNumber(e.target.value.replace(/\D/g, ""))}
            />
            <p className="text-xs text-muted-foreground">+ R$ 25,00 por numero</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
            <p>Nomes: {customNameCount} x R$ 25,00</p>
            <p>Numeros: {customNumberCount} x R$ 25,00</p>
          </div>

          {customName || customNumber ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Preview textual</p>
              {customName ? <p className="mt-3 text-lg font-black uppercase tracking-[0.2em] text-slate-900">{customName}</p> : null}
              {customNumber ? <p className="mt-2 text-4xl font-black tracking-[0.2em] text-slate-900">{customNumber}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Preco final</span>
          <span className="text-2xl font-extrabold text-[#102a5c]">R$ {finalPrice.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button size="lg" className="flex-1" onClick={handleAddToCart}>
          Adicionar ao Carrinho
        </Button>
        <Button size="lg" variant="outline" onClick={handleBuyNow}>
          Comprar Agora
        </Button>
      </div>
    </>
  )
}
