"use client"

import { CartProvider } from "@/context/cart-context"
import { ToastProvider } from "@/context/toast-context"
import { WishlistProvider } from "@/context/wishlist-context"
import { ClerkProvider } from "@clerk/nextjs"
import { type ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </ClerkProvider>
  )
}
