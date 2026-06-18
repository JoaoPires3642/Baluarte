"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem")
      return
    }

    if (!token) {
      setError("Token de redefinição inválido")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changePasswordId: token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha")
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch {
      setError("Erro ao conectar. Tente novamente.")
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#0f274d]">
              Link inválido
            </h1>
            <p className="text-sm text-slate-500">
              O link de redefinição está inválido ou expirou.
              Solicite um novo link.
            </p>
          </div>
          <Button asChild className="w-full" size="lg">
            <Link href="/esqueci-minha-senha">
              Solicitar novo link
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#0f274d]">
              Senha redefinida
            </h1>
            <p className="text-sm text-slate-500">
              Sua senha foi alterada com sucesso!
            </p>
          </div>
          <Button asChild className="w-full" size="lg">
            <Link href="/sign-in">Fazer login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-[#0f274d]">
            Redefinir senha
          </h1>
          <p className="text-sm text-slate-500">
            Digite sua nova senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => { setPassword(e.target.value); }}
              required
              autoComplete="new-password"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); }}
              required
              autoComplete="new-password"
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
            {loading ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </form>
      </div>
    </div>
  )
}
