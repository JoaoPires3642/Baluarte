import { auth, currentUser } from "@clerk/nextjs/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

type BackendAuthSession = {
  userId: string
  email: string
  role?: string
  internalRole?: string
}

export async function resolveServerAuthSession() {
  const { userId, getToken } = await auth()
  if (!userId) {
    return { isAuthenticated: false as const, isAdmin: false as const, session: null }
  }

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase()
  const token = await getToken()

  if (!email || !token) {
    return { isAuthenticated: true as const, isAdmin: false as const, session: null }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Clerk-User-Id": userId,
        "X-Clerk-Email": email,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return { isAuthenticated: true as const, isAdmin: false as const, session: null }
    }

    const payload = await response.json().catch(() => null) as { data?: BackendAuthSession } | null
    const session = payload?.data ?? null
    const internalRole = String(session?.internalRole || session?.role || "").toLowerCase()

    return {
      isAuthenticated: true as const,
      isAdmin: internalRole === "admin",
      session,
    }
  } catch {
    return { isAuthenticated: true as const, isAdmin: false as const, session: null }
  }
}
