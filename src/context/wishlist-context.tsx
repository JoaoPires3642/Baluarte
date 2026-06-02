"use client"

import { useUser } from "@clerk/nextjs"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

type WishlistItem = {
  id: string
  name: string
  price: number
  image?: string
}

type WishlistContextType = {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  isInWishlist: (id: string) => boolean
}

const WishlistContext = createContext<WishlistContextType | null>(null)
const WISHLIST_STORAGE_PREFIX = "baluarte.wishlist.v1"

function readStoredWishlist(storageKey: string): WishlistItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isLoaded, user } = useUser()
  const storageKey = useMemo(
    () => `${WISHLIST_STORAGE_PREFIX}.${user?.id || "guest"}`,
    [user?.id]
  )
  const [items, setItems] = useState<WishlistItem[]>([])

  useEffect(() => {
    if (!isLoaded) return
    setItems(readStoredWishlist(storageKey))
  }, [isLoaded, storageKey])

  useEffect(() => {
    if (!isLoaded) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items))
    } catch {
      // Storage can be unavailable in private mode; wishlist still works in memory.
    }
  }, [isLoaded, items, storageKey])

  const addItem = (item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev
      return [...prev, item]
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const isInWishlist = (id: string) => items.some((i) => i.id === id)

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider")
  return ctx
}
