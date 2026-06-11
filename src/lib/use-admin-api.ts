import { useAuth, useUser } from "@clerk/nextjs"
import { useCallback } from "react"
import { getBrowserSafeApiBaseUrl } from "@/lib/api-base"

export function useAdminApi() {
  const { getToken, userId } = useAuth()
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress

  const authedFetch = useCallback(async (path: string, options?: RequestInit) => {
    const token = await getToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userId ? { "X-Clerk-User-Id": userId } : {}),
      ...(email ? { "X-Clerk-Email": email } : {}),
      ...(options?.headers as Record<string, string>),
    }

    const response = await fetch(`${getBrowserSafeApiBaseUrl()}${path}`, {
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
  }, [getToken, userId, email])

  return { authedFetch }
}
