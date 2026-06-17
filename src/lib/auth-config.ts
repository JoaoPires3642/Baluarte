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

export const authOptions: NextAuthOptions = {
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
      ;(session as unknown as Record<string, unknown>).accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: "/sign-in",
  },
}
