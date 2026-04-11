import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import type { ToastItem } from "@/context/toast-context"

type ToastProps = {
  toast: ToastItem
  onClose: () => void
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const colors = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
}

export function Toast({ toast, onClose }: ToastProps) {
  const Icon = icons[toast.type]

  return (
    <div className={`${colors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-in slide-in-from-right`}>
      <Icon className="w-5 h-5" />
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} className="hover:opacity-80">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}