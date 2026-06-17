import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { getAuthHeaders } from "@/lib/auth-headers"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

type BackendAuthSession = {
  userId: string
  email: string
  role?: string
  internalRole?: string
}

export async function resolveServerAuthSession() {
  const { headers, userId } = await getAuthHeaders()

  if (!userId) {
    return { isAuthenticated: false as const, isAdmin: false as const, session: null }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: "GET",
      headers: { ...headers, Accept: "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      return { isAuthenticated: true as const, isAdmin: false as const, session: null }
    }

    const payload = await response.json().catch(() => null) as { data?: BackendAuthSession } | null
    const backendSession = payload?.data ?? null
    const internalRole = String(backendSession?.internalRole || backendSession?.role || "").toLowerCase()

    return {
      isAuthenticated: true as const,
      isAdmin: internalRole === "admin",
      session: backendSession,
    }
  } catch {
    return { isAuthenticated: true as const, isAdmin: false as const, session: null }
  }
}

export async function getServerUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id ?? null
}

export async function getServerUserEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.email ?? null
}
