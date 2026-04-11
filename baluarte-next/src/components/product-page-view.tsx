"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ShieldCheck, Shirt, Truck } from "lucide-react"
import type { ModelDetail } from "@/lib/api"
import { resolveMediaUrl } from "@/lib/media"
import { Badge } from "@/components/ui/badge"
import { ProductForm } from "@/components/product-form"
import { WishlistButton } from "@/components/wishlist-button"

export function ProductPageView({ product }: { product: ModelDetail }) {
  const productGallery = useMemo(
    () => (product.images || []).map((image) => resolveMediaUrl(image)).filter(Boolean) as string[],
    [product.images]
  )
  const fallbackImage = resolveMediaUrl(product.thumbnailUrl || product.imageUrl)
  const [selectedImage, setSelectedImage] = useState(productGallery[0] || fallbackImage)

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Link href="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Voltar
      </Link>
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="overflow-hidden rounded-[2rem] border border-[#d9e2ef] bg-white shadow-lg shadow-slate-900/5">
          <div className="relative aspect-square flex items-center justify-center bg-slate-100">
            {selectedImage ? (
              <Image src={selectedImage} alt={product.modelName} fill unoptimized className="object-cover" />
            ) : (
              <Shirt className="h-16 w-16 text-[#0f274d]" />
            )}
          </div>
        </div>

        <div className="space-y-5 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 md:space-y-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Badge variant="outline" className="mb-3 rounded-full border-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]">{product.teamSlug}</Badge>
              <h1 className="text-2xl font-extrabold uppercase tracking-[-0.04em] text-slate-900 sm:text-3xl md:text-4xl">{product.modelName}</h1>
            </div>
            <WishlistButton product={product} />
          </div>

          {productGallery.length > 1 ? (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {productGallery.slice(0, 4).map((image, index) => (
                <button
                  key={`${product.id}-thumb-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`relative aspect-square overflow-hidden rounded-2xl border bg-slate-100 ${selectedImage === image ? "border-[#1e3a8a] ring-2 ring-[#1e3a8a]/15" : "border-slate-200"}`}
                >
                  <Image src={image} alt={`${product.modelName} ${index + 1}`} fill unoptimized className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-baseline gap-2 border-b border-slate-100 pb-5 sm:gap-3">
            <span className="text-3xl font-extrabold text-[#102a5c] sm:text-4xl">
              R$ {Number(product.price).toFixed(2).replace(".", ",")}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through sm:text-xl">
                  R$ {Number(product.originalPrice).toFixed(2).replace(".", ",")}
                </span>
                <Badge variant="destructive">
                  -{Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
                </Badge>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-base leading-7 text-slate-600">{product.description}</p>
          )}

          <div className="grid gap-3 rounded-[1.5rem] border border-[#e6edf6] bg-[#f8fbff] p-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-[#0f274d]" />
              <span>Acabamento pensado para uma apresentação mais premium da coleção.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Truck className="mt-0.5 h-5 w-5 text-[#c3222a]" />
              <span>Fluxo de compra com destaque claro para entrega e pagamento.</span>
            </div>
          </div>

          <ProductForm product={product} />
        </div>
      </div>
    </div>
  )
}
