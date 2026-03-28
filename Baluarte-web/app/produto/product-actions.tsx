"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { Product, Size } from "@/lib/types";
import { ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleAddToCart = () => {
    if (!selectedSize) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/carrinho");
      return;
    }

    addItem(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!selectedSize) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/carrinho");
      return;
    }

    addItem(product, selectedSize);
    router.push("/carrinho");
  };

  return (
    <div className="mt-6">
      {/* Size Selection */}
      <div>
        <label className="text-sm font-medium text-foreground">
          Tamanho
        </label>
        <div className="mt-2 flex gap-2">
          {product.sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                selectedSize === size
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-foreground hover:border-primary/50"
              )}
            >
              {size}
            </button>
          ))}
        </div>
        {!selectedSize && (
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione um tamanho
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="flex-1 gap-2"
          onClick={handleAddToCart}
          disabled={!selectedSize || !product.inStock}
        >
          {added ? (
            <>
              <Check className="h-5 w-5" />
              Adicionado!
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              Adicionar ao Carrinho
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="flex-1"
          onClick={handleBuyNow}
          disabled={!selectedSize || !product.inStock}
        >
          Comprar Agora
        </Button>
      </div>

      {!product.inStock && (
        <p className="mt-3 text-center text-sm text-destructive">
          Produto temporariamente indisponível
        </p>
      )}
    </div>
  );
}
