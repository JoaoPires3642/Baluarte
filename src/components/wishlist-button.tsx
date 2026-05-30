"use client"

import { useWishlist } from "@/context/wishlist-context"
import { useToast } from "@/context/toast-context"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ModelDetail } from "@/lib/api"

type WishlistButtonProps = {
  product: ModelDetail
}

export function WishlistButton({ product }: WishlistButtonProps) {
  const { addItem, removeItem, isInWishlist } = useWishlist()
  const { showToast } = useToast()
  const inWishlist = isInWishlist(product.id)

  const toggle = () => {
    if (inWishlist) {
      removeItem(product.id)
      showToast("Remido dos favoritos", "info")
    } else {
      addItem({
        id: product.id,
        name: product.modelName,
        price: product.price,
        image: product.imageUrl,
      })
      showToast("Adicionado aos favoritos!", "success")
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={inWishlist ? "text-red-500" : ""}
    >
      <Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
    </Button>
  )
}
