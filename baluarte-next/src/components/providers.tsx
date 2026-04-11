"use client"

import { CartProvider } from "@/context/cart-context"
import { ToastProvider } from "@/context/toast-context"
import { WishlistProvider } from "@/context/wishlist-context"
import { type ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <WishlistProvider>
        <CartProvider>{children}</CartProvider>
      </WishlistProvider>
    </ToastProvider>
  )
}