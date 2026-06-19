import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

export async function resolveServerAuthSession() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null

  if (!userId) {
    return { isAuthenticated: false as const, isAdmin: false as const, session: null }
  }

  const isAdmin = !!(session as unknown as Record<string, unknown>).isAdmin

  return { isAuthenticated: true as const, isAdmin, session: null }
}

export async function getServerUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id ?? null
}

export async function getServerUserEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.email ?? null
}
