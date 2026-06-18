"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignUpPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Não foi possível criar a conta")
        setLoading(false)
        return
      }

      if (data.linked) {
        setLoading(false)
        setError(
          "Email já cadastrado! Faça login com sua senha existente."
        )
        return
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      setLoading(false)

      if (result?.error) {
        setError("Conta criada! Faça login para continuar.")
        router.push("/sign-in")
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Erro ao criar conta. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-[#0f274d]">Criar conta</h1>
          <p className="text-sm text-slate-500">
            Cadastre-se na Baluarte
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="João"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); }}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Silva"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); }}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

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
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => { setPassword(e.target.value); }}
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
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link href="/sign-in" className="font-medium text-[#0f274d] underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
