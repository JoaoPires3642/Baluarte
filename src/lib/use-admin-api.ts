import { useAuth } from "@clerk/nextjs"
import { useCallback } from "react"

export function useAdminApi() {
  const { getToken, userId } = useAuth()

  const authedFetch = useCallback(async (path: string, options?: RequestInit) => {
    const token = await getToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { "X-Clerk-Session-Token": token } : {}),
      ...(userId ? { "X-Clerk-User-Id": userId } : {}),
      ...(options?.headers as Record<string, string>),
    }

    const response = await fetch(`/api/admin${path}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const errPayload = body?.error
      const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
      throw new Error((errPayload?.message || "Erro na requisição") + details)
    }

    return response.json()
  }, [getToken, userId])

  return { authedFetch }
}
