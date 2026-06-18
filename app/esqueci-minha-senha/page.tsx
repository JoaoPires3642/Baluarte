"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao processar solicitação")
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

  if (success) {
    return (
      <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#0f274d]">Email enviado</h1>
            <p className="text-sm text-slate-500">
              Se o email existir, você receberá um link para redefinir sua senha.
              Verifique sua caixa de entrada e spam.
            </p>
          </div>
          <Button asChild className="w-full" size="lg">
            <Link href="/sign-in">Voltar para login</Link>
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
            Esqueci minha senha
          </h1>
          <p className="text-sm text-slate-500">
            Digite seu email para receber um link de redefinição
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

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar link"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Lembrou sua senha?{" "}
          <Link href="/sign-in" className="font-medium text-[#0f274d] underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
