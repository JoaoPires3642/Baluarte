import { useSession } from "next-auth/react"
import { useCallback } from "react"
import { getBrowserSafeApiBaseUrl } from "@/lib/api-base"

export function useAdminApi() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const email = session?.user?.email

  const authedFetch = useCallback(async (path: string, options?: RequestInit) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(userId ? { "X-User-Id": userId } : {}),
      ...(email ? { "X-User-Email": email } : {}),
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
  }, [userId, email])

  return { authedFetch }
}
