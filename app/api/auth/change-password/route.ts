import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const FUSIONAUTH_ISSUER = process.env.FUSIONAUTH_ISSUER!
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY!
const FUSIONAUTH_APP_ID = process.env.FUSIONAUTH_CLIENT_ID!

export async function POST(request: NextRequest) {
  let changePasswordId: string
  let password: string

  try {
    const body = await request.json()
    changePasswordId = body.changePasswordId
    password = body.password
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  if (!changePasswordId || !password) {
    return NextResponse.json(
      { error: "Token e nova senha são obrigatórios" },
      { status: 400 }
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter no mínimo 8 caracteres" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `${FUSIONAUTH_ISSUER}/api/user/change-password`,
      {
        method: "POST",
        headers: {
          Authorization: FUSIONAUTH_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changePasswordId,
          password,
          applicationId: FUSIONAUTH_APP_ID,
        }),
      }
    )

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const error =
        data?.generalErrors?.[0]?.message ||
        data?.generalErrors?.[0]?.code ||
        "Token inválido ou expirado. Solicite um novo link."
      return NextResponse.json({ error }, { status: res.status })
    }

    return NextResponse.json({ message: "Senha redefinida com sucesso!" })
  } catch {
    return NextResponse.json(
      { error: "Erro ao conectar com o serviço de autenticação" },
      { status: 502 }
    )
  }
}
