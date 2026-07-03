"use client"

import { useEffect, useRef, useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect_url") || searchParams.get("callbackUrl") || searchParams.get("callback_url") || "/"
  const sessionExpired = searchParams.get("error") === "SessionExpired"
  const { status } = useSession()
  const signedOutRef = useRef(false)

  // If we arrived via a 401 (SessionExpired) the next-auth cookie may still be
  // present but the backend token is dead. Clear it so we don't bounce back to
  // the protected page (which would 401 again -> redirect loop).
  // Otherwise, if genuinely authenticated, leave the sign-in page.
  useEffect(() => {
    if (sessionExpired && status === "authenticated") {
      if (!signedOutRef.current) {
        signedOutRef.current = true
        void signOut({ redirect: false })
      }
      return
    }
    if (!sessionExpired && status === "authenticated") {
      router.replace(redirectTo)
    }
  }, [sessionExpired, status, redirectTo, router])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError(result.error === "CredentialsSignin" ? "Email ou senha incorretos" : "Erro ao entrar. Tente novamente.")
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-[#0f274d]">Entrar</h1>
          <p className="text-sm text-slate-500">
            Acesse sua conta Baluarte
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); }}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/esqueci-minha-senha"
                className="text-xs text-slate-500 hover:text-[#0f274d] underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => { setPassword(e.target.value); }}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Não tem conta?{" "}
          <Link href="/sign-up" className="font-medium text-[#0f274d] underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
