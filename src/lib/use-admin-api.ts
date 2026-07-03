import { useCallback } from "react"
import { apiFetch } from "@/lib/api-client"

export function useAdminApi() {
  const authedFetch = useCallback(async (path: string, options?: RequestInit) => {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path
    const response = await apiFetch(`/api/admin/${cleanPath}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers as Record<string, string>),
      },
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const errPayload = body?.error
      const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
      throw new Error((errPayload?.message || "Erro na requisição") + details)
    }

    return response.json()
  }, [])

  return { authedFetch }
}
