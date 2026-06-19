import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const FUSIONAUTH_ISSUER = process.env.FUSIONAUTH_ISSUER!
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY!
const FUSIONAUTH_APP_ID = process.env.FUSIONAUTH_CLIENT_ID!

type FusionAuthUser = {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

const ADMIN_API_BASE = process.env.BACKEND_INTERNAL_URL || (process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_API_BASE_URL : "http://localhost:8080/api/v1")

async function resolveAdminStatus(userId: string, email: string): Promise<boolean> {
  try {
    const res = await fetch(`${ADMIN_API_BASE}/auth/session`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-User-Id": userId,
        "X-User-Email": email,
      },
      cache: "no-store",
    })
    if (!res.ok) return false
    const payload = await res.json() as { data?: { internalRole?: string; role?: string } } | null
    const role = String(payload?.data?.internalRole || payload?.data?.role || "").toLowerCase()
    return role === "admin"
  } catch {
    return false
  }
}

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
        const lastCheck = (token.lastAdminCheck as number) || 0
        if (Date.now() - lastCheck > 15 * 60 * 1000) {
          token.isAdmin = await resolveAdminStatus(token.id as string, token.email as string)
          token.lastAdminCheck = Date.now()
        }
      }

      if (token.tokenExpiration && Date.now() >= (token.tokenExpiration as number)) {
        const refreshRes = await fetch(`${FUSIONAUTH_ISSUER}/api/jwt/refresh`, {
          method: "POST",
          headers: {
            Authorization: FUSIONAUTH_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token.accessToken,
            applicationId: FUSIONAUTH_APP_ID,
          }),
        })

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          if (refreshData.token) {
            token.accessToken = refreshData.token
            token.tokenExpiration = refreshData.tokenExpirationInstant
          }
        }
      }

      return token
    },
    async session({ session, token }) {
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
