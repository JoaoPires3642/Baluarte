import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

const FUSIONAUTH_ISSUER = process.env.FUSIONAUTH_ISSUER!
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY!
const FUSIONAUTH_APP_ID = process.env.FUSIONAUTH_CLIENT_ID!

type AuthHeadersResult = {
  headers: Record<string, string>
  userId: string | null
  email: string | null
  accessToken: string | null
}

async function refreshAccessToken(currentToken: string): Promise<{ accessToken: string; tokenExpiration: number } | null> {
  try {
    const res = await fetch(`${FUSIONAUTH_ISSUER}/api/jwt/refresh`, {
      method: "POST",
      headers: {
        Authorization: FUSIONAUTH_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: currentToken, applicationId: FUSIONAUTH_APP_ID }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.token) return null
    return { accessToken: data.token, tokenExpiration: data.tokenExpirationInstant }
  } catch {
    return null
  }
}

export async function getAuthHeaders(forceRefresh = false): Promise<AuthHeadersResult> {
  const session = await getServerSession(authOptions)

  const userId = session?.user?.id ?? null
  const email = session?.user?.email ?? null
  const extended = session as Record<string, unknown> | null
  let accessToken = extended?.accessToken as string | undefined
  const tokenExpiration = extended?.tokenExpiration as number | undefined

  if (accessToken && (forceRefresh || (tokenExpiration && Date.now() >= tokenExpiration))) {
    const refreshed = await refreshAccessToken(accessToken)
    if (refreshed) {
      accessToken = refreshed.accessToken
    }
  }

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

  return { headers, userId, email, accessToken: accessToken ?? null }
}
