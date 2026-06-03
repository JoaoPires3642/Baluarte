import Image from "next/image"
import Link from "next/link"
import { Shirt } from "lucide-react"
import { resolveMediaUrl } from "@/lib/media"
import { Card, CardContent } from "@/components/ui/card"

type ProductCardProps = {
  href: string
  teamLabel: string
  title: string
  price: number
  originalPrice?: number | null
  imageUrl?: string | null
  badge?: string
}

export function ProductCard({ href, teamLabel, title, price, originalPrice, imageUrl, badge }: ProductCardProps) {
  const mediaUrl = resolveMediaUrl(imageUrl || undefined)
  const badgeClasses = [
    "absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-full bg-[#c3222a]",
    "px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white",
    "shadow-lg shadow-red-950/20 sm:px-3 sm:text-[11px] sm:tracking-[0.18em]",
  ].join(" ")
  const discountPercent = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null

  return (
    <Link href={href}>
      <Card className="group cursor-pointer overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10 sm:rounded-[1.5rem]">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {mediaUrl ? (
            <Image
              src={mediaUrl}
              alt={title || "Produto Baluarte"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#0f274d]">
              <Shirt className="h-12 w-12 sm:h-14 sm:w-14" />
            </div>
          )}

          {badge ? (
            <div className={badgeClasses}>
              {badge}
            </div>
          ) : null}

          {discountPercent ? (
            <div className="absolute right-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0f274d] shadow-sm">
              -{discountPercent}%
            </div>
          ) : null}
        </div>

        <CardContent className="p-3 sm:p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{teamLabel}</p>
          <h3 className="mt-2 line-clamp-2 text-sm font-bold uppercase tracking-[-0.03em] text-slate-900 transition-colors group-hover:text-[#0f274d] sm:text-lg">
            {title}
          </h3>
          <div className="mt-3 border-t border-slate-100 pt-3">
            {originalPrice ? (
              <p className="mb-1 text-xs text-slate-400 line-through sm:text-sm">
                R$ {Number(originalPrice).toFixed(2).replace(".", ",")}
              </p>
            ) : null}
            <p className="text-lg font-extrabold text-[#102a5c] sm:text-2xl">
              R$ {Number(price).toFixed(2).replace(".", ",")}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
