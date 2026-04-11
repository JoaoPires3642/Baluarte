"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Images, ShieldCheck, Shirt, Truck } from "lucide-react"
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
  const gallery = productGallery.length > 0 ? productGallery : fallbackImage ? [fallbackImage] : []
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedImage = gallery[selectedIndex]
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const goToPreviousImage = () => {
    setSelectedIndex((current) => (current === 0 ? gallery.length - 1 : current - 1))
  }

  const goToNextImage = () => {
    setSelectedIndex((current) => (current === gallery.length - 1 ? 0 : current + 1))
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
    touchEndX.current = null
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return

    const deltaX = touchStartX.current - touchEndX.current

    if (Math.abs(deltaX) < 40) return

    if (deltaX > 0) {
      goToNextImage()
    } else {
      goToPreviousImage()
    }
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <Link href="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Voltar
      </Link>
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
        <div className="overflow-hidden rounded-[2rem] border border-[#d9e2ef] bg-white shadow-lg shadow-slate-900/5">
          <div className="relative aspect-square flex items-center justify-center bg-slate-100" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            {selectedImage ? (
              <Image src={selectedImage} alt={product.modelName} fill unoptimized className="object-cover" />
            ) : (
              <Shirt className="h-16 w-16 text-[#0f274d]" />
            )}

            {gallery.length > 1 ? (
              <>
                <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0f274d] shadow-sm">
                    <Images className="h-3.5 w-3.5" /> {selectedIndex + 1}/{gallery.length}
                  </span>
                </div>
            <div className="absolute inset-x-0 top-1/2 hidden -translate-y-1/2 items-center justify-between px-3 sm:flex">
                  <button type="button" onClick={goToPreviousImage} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#0f274d] shadow-md backdrop-blur hover:bg-white" aria-label="Imagem anterior">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={goToNextImage} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#0f274d] shadow-md backdrop-blur hover:bg-white" aria-label="Próxima imagem">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-slate-950/45 px-3 py-2 backdrop-blur sm:hidden">
                  {gallery.map((image, index) => (
                    <button key={`${image}-dot`} type="button" onClick={() => setSelectedIndex(index)} className={`h-2.5 rounded-full transition-all ${selectedIndex === index ? "w-6 bg-white" : "w-2.5 bg-white/50"}`} aria-label={`Ir para imagem ${index + 1}`} />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {gallery.length > 1 ? (
            <div className="flex gap-3 overflow-x-auto border-t border-slate-100 p-3 sm:p-4">
              {gallery.map((image, index) => (
                <button
                  key={`${product.id}-thumb-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-slate-100 sm:h-20 sm:w-20 ${selectedIndex === index ? "border-[#1e3a8a] ring-2 ring-[#1e3a8a]/15" : "border-slate-200"}`}
                >
                  <Image src={image} alt={`${product.modelName} ${index + 1}`} fill unoptimized className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4 rounded-[2rem] border border-[#d9e2ef] bg-white p-4 shadow-sm shadow-slate-900/5 md:space-y-6 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="outline" className="mb-2 rounded-full border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">{product.teamSlug}</Badge>
              <h1 className="text-xl font-extrabold uppercase tracking-[-0.04em] text-slate-900 sm:text-3xl md:text-4xl">{product.modelName}</h1>
            </div>
            <WishlistButton product={product} />
          </div>

          <div className="flex flex-wrap items-baseline gap-2 border-b border-slate-100 pb-4 sm:gap-3 sm:pb-5">
            <span className="text-2xl font-extrabold text-[#102a5c] sm:text-4xl">
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

          {product.description ? (
            <p className="line-clamp-3 text-sm leading-6 text-slate-600 sm:line-clamp-none sm:text-base sm:leading-7">{product.description}</p>
          ) : null}

          <div className="flex flex-wrap gap-2 rounded-[1.25rem] border border-[#e6edf6] bg-[#f8fbff] p-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600"><ShieldCheck className="h-4 w-4 text-[#0f274d]" /> Compra segura</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600"><Truck className="h-4 w-4 text-[#c3222a]" /> Envio claro</span>
          </div>

          <ProductForm product={product} />
        </div>
      </div>
    </div>
  )
}
