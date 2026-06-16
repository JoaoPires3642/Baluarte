import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

type BackendAuthSession = {
  userId: string
  email: string
  role?: string
  internalRole?: string
}

export async function resolveServerAuthSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session?.user?.email) {
    return { isAuthenticated: false as const, isAdmin: false as const, session: null }
  }

  const userId = session.user.id
  const email = session.user.email

  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-User-Id": userId,
        "X-User-Email": email,
      },
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
