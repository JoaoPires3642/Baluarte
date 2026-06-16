"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold text-[#0f274d]">Entrar</h1>
        <p className="text-sm text-slate-500">
          Faça login com sua conta Baluarte
        </p>
        <Button
          className="w-full"
          size="lg"
          onClick={() => signIn("keycloak")}
        >
          Entrar com Keycloak
        </Button>
      </div>
    </div>
  )
}
