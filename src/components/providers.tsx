"use client"

import { CartProvider } from "@/context/cart-context"
import { ToastProvider } from "@/context/toast-context"
import { WishlistProvider } from "@/context/wishlist-context"
import { SessionProvider } from "next-auth/react"
import { type ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </SessionProvider>
  )
}
