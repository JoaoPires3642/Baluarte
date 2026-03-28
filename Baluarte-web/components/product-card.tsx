"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0;

  return (
    <Link href={`/produto/${product.id}`} className="group">
      <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-xl border border-border bg-secondary shadow-sm">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hasDiscount && (
          <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1">
            -{discountPercentage}%
          </Badge>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Esgotado
            </span>
          </div>
        )}
        
        {/* Quick View on Hover - Desktop */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
          <div className="bg-primary text-primary-foreground text-center py-3 text-xs font-semibold uppercase tracking-wider">
            Ver Detalhes
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium">
          {product.team.name}
        </p>
        <h3 className="text-xs md:text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-sm md:text-base font-bold text-primary">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              R$ {product.originalPrice!.toFixed(2).replace(".", ",")}
            </span>
          )}
        </div>
        
        {/* Sizes Preview */}
        <div className="flex gap-1 pt-1">
          {product.sizes.slice(0, 4).map((size) => (
            <span
              key={size}
              className="text-[10px] text-muted-foreground font-medium"
            >
              {size}
            </span>
          ))}
          {product.sizes.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{product.sizes.length - 4}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
