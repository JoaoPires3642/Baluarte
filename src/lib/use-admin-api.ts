import { useAuth, useUser } from "@clerk/nextjs"
import { useCallback } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

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

    const response = await fetch(`${API_BASE_URL}${path}`, {
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
