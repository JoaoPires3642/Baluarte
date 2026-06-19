import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

const PROXY_SECRET = process.env.PROXY_SECRET || ""

type AuthHeadersResult = {
  headers: Record<string, string>
  userId: string | null
  email: string | null
}

export async function getAuthHeaders(): Promise<AuthHeadersResult> {
  const session = await getServerSession(authOptions)

  const userId = session?.user?.id ?? null
  const email = session?.user?.email ?? null
  const extended = session as Record<string, unknown> | null
  const accessToken = extended?.accessToken as string | undefined

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

  if (PROXY_SECRET) {
    headers["X-Proxy-Secret"] = PROXY_SECRET
  }

  return { headers, userId, email }
}
