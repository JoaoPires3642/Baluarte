import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const FUSIONAUTH_ISSUER = process.env.FUSIONAUTH_ISSUER!
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY!
const FUSIONAUTH_APP_ID = process.env.FUSIONAUTH_CLIENT_ID!
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8080"

export async function POST(request: NextRequest) {
  let email: string

  try {
    const body = await request.json()
    email = body.email
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email é obrigatório" },
      { status: 400 }
    )
  }

  try {
    const faRes = await fetch(
      `${FUSIONAUTH_ISSUER}/api/user/forgot-password`,
      {
        method: "POST",
        headers: {
          Authorization: FUSIONAUTH_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId: email.trim().toLowerCase(),
          applicationId: FUSIONAUTH_APP_ID,
          sendForgotPasswordEmail: false,
        }),
      }
    )

    const faData = await faRes.json().catch(() => null)

    if (!faRes.ok) {
      if (faRes.status === 404) {
        return NextResponse.json({
          message:
            "Se o email existir, você receberá um link para redefinir sua senha.",
        })
      }
      return NextResponse.json(
        { error: "Erro ao processar solicitação" },
        { status: 502 }
      )
    }

    const changePasswordId = faData?.changePasswordId as string | undefined

    if (!changePasswordId) {
      return NextResponse.json(
        { error: "Erro ao gerar token de redefinição" },
        { status: 502 }
      )
    }

    const backendRes = await fetch(
      `${BACKEND_URL}/api/v1/auth/send-password-reset`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          changePasswordId,
        }),
      }
    )

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: "Erro ao enviar email" },
        { status: 502 }
      )
    }

    return NextResponse.json({
      message:
        "Se o email existir, você receberá um link para redefinir sua senha.",
    })
  } catch {
    return NextResponse.json(
      { error: "Erro ao conectar com o serviço de autenticação" },
      { status: 502 }
    )
  }
}
