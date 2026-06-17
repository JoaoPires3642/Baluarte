"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type CartItem = {
  id: string
  name: string
  price: number
  basePrice?: number
  image?: string
  teamName?: string
  size: string
  quantity: number
  stockQuantity?: number
  customNames?: string[]
  customNumber?: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string, size: string) => void
  updateQuantity: (id: string, size: string, quantity: number) => void
  clear: () => void
  total: number
}

const CartContext = createContext<CartContextType | null>(null)
const CART_STORAGE_KEY = "baluarte.cart.v1"

function clampQuantity(quantity: number, stockQuantity?: number) {
  if (typeof stockQuantity !== "number") return quantity
  return Math.min(quantity, Math.max(0, stockQuantity))
}

function readStoredCart() {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart)

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage can be unavailable in private mode; cart still works in memory.
    }
  }, [items])

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.size === item.size)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.size === item.size
            ? {
                ...i,
                stockQuantity: item.stockQuantity ?? i.stockQuantity,
                quantity: clampQuantity(i.quantity + item.quantity, item.stockQuantity ?? i.stockQuantity),
              }
            : i
        )
      }
      return [...prev, { ...item, quantity: clampQuantity(item.quantity, item.stockQuantity) }]
    })
  }

  const removeItem = (id: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.size === size)))
  }

  const updateQuantity = (id: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id, size)
      return
    }
    setItems((prev) => prev.map((i) => (i.id === id && i.size === size ? { ...i, quantity: clampQuantity(quantity, i.stockQuantity) } : i)))
  }

  const clear = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const value = useMemo(() => ({ items, addItem, removeItem, updateQuantity, clear, total }), [items, addItem, removeItem, updateQuantity, clear, total])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
