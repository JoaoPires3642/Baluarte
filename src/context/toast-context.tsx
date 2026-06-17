"use client"

import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { Toast } from "@/components/ui/toast"

export type ToastType = "success" | "error" | "info"

export type ToastItem = {
  id: string
  message: string
  type: ToastType
}

type ToastContextType = {
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextToastId = useRef(0)

  const showToast = (message: string, type: ToastType = "info") => {
    nextToastId.current += 1
    const id = `toast-${nextToastId.current}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => { removeToast(id); }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const value = useMemo(() => ({ toasts, showToast, removeToast }), [toasts, showToast, removeToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => { removeToast(toast.id); }} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
