import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const FUSIONAUTH_ISSUER = process.env.FUSIONAUTH_ISSUER!
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY!
const FUSIONAUTH_APP_ID = process.env.FUSIONAUTH_CLIENT_ID!
const PROXY_SECRET = process.env.PROXY_SECRET || ""

const ADMIN_API_BASE = process.env.BACKEND_INTERNAL_URL || (process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_API_BASE_URL : "http://localhost:8080/api/v1")

type FusionAuthUser = {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

async function resolveAdminStatus(userId: string, email: string): Promise<boolean> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)
  try {
    const res = await fetch(`${ADMIN_API_BASE}/auth/session`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-User-Id": userId,
        "X-User-Email": email,
        "X-Proxy-Secret": PROXY_SECRET,
      },
      cache: "no-store",
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return false
    const payload = await res.json() as { data?: { internalRole?: string; role?: string } } | null
    const role = String(payload?.data?.internalRole || payload?.data?.role || "").toLowerCase()
    return role === "admin"
  } catch {
    clearTimeout(timeoutId)
    return false
  }
}

async function refreshFusionAuthToken(
  currentToken: string
): Promise<{ accessToken: string; tokenExpiration: number } | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(`${FUSIONAUTH_ISSUER}/api/jwt/refresh`, {
        method: "POST",
        headers: {
          Authorization: FUSIONAUTH_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: currentToken, applicationId: FUSIONAUTH_APP_ID }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          return { accessToken: data.token, tokenExpiration: data.tokenExpirationInstant }
        }
      }
    } catch {
      // retry
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
  }
  return null
}

const ADMIN_REFRESH_INTERVAL = 15 * 60 * 1000

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const res = await fetch(`${FUSIONAUTH_ISSUER}/api/login`, {
          method: "POST",
          headers: {
            Authorization: FUSIONAUTH_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loginId: credentials.email,
            password: credentials.password,
            applicationId: FUSIONAUTH_APP_ID,
          }),
        })

        if (!res.ok) return null

        const data = await res.json()
        const user = data.user as FusionAuthUser

        if (!user?.id || !user?.email) return null

        return {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
          accessToken: data.token as string,
          tokenExpiration: data.tokenExpirationInstant as number,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; email: string; accessToken?: string; tokenExpiration?: number }
        token.id = u.id
        token.email = u.email
        token.accessToken = u.accessToken
        token.tokenExpiration = u.tokenExpiration
        token.isAdmin = await resolveAdminStatus(u.id, u.email ?? "")
        token.lastAdminCheck = Date.now()
      } else if (token.id && token.email) {
        if (token.isAdmin === undefined) {
          token.isAdmin = await resolveAdminStatus(token.id as string, token.email as string)
          token.lastAdminCheck = Date.now()
        } else {
          const lastCheck = (token.lastAdminCheck as number) || 0
          if (Date.now() - lastCheck > ADMIN_REFRESH_INTERVAL) {
            token.isAdmin = await resolveAdminStatus(token.id as string, token.email as string)
            token.lastAdminCheck = Date.now()
          }
        }
      }

      if (token.accessToken && token.tokenExpiration && Date.now() >= (token.tokenExpiration as number)) {
        const refreshed = await refreshFusionAuthToken(token.accessToken as string)
        if (refreshed) {
          token.accessToken = refreshed.accessToken
          token.tokenExpiration = refreshed.tokenExpiration
        } else {
          // Token expirado e refresh falhou -> marca erro para o callback `session`
          // invalidar a sessao visivel ao cliente
          token.error = "RefreshAccessTokenError"
          ;(token as Record<string, unknown>).id = undefined
          ;(token as Record<string, unknown>).email = undefined
          ;(token as Record<string, unknown>).accessToken = undefined
          ;(token as Record<string, unknown>).tokenExpiration = undefined
          ;(token as Record<string, unknown>).isAdmin = undefined
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token.error === "RefreshAccessTokenError") {
        const empty = { ...session } as Record<string, unknown>
        empty.user = undefined
        empty.expires = new Date(0).toISOString()
        return empty as unknown as typeof session
      }
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      const extendedSession = session as unknown as Record<string, unknown>
      extendedSession.accessToken = token.accessToken
      extendedSession.tokenExpiration = token.tokenExpiration as number | undefined
      extendedSession.isAdmin = token.isAdmin as boolean | undefined
      return session
    },
  },
  pages: {
    signIn: "/sign-in",
  },
}
