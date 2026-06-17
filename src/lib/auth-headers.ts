import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

type AuthHeadersResult = {
  headers: Record<string, string>
  userId: string | null
  email: string | null
}

export async function getAuthHeaders(): Promise<AuthHeadersResult> {
  const session = await getServerSession(authOptions)

  const userId = session?.user?.id ?? null
  const email = session?.user?.email ?? null
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  if (userId) {
    headers["X-User-Id"] = userId
  }

  if (email) {
    headers["X-User-Email"] = email
  }

  return { headers, userId, email }
}
