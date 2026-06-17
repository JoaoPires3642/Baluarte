import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const FUSIONAUTH_ISSUER = process.env.FUSIONAUTH_ISSUER!
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY!
const FUSIONAUTH_APP_ID = process.env.FUSIONAUTH_CLIENT_ID!

type RegisterBody = {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
}

export async function POST(request: NextRequest) {
  let body: RegisterBody | null = null

  try {
    const raw = await request.text()
    body = JSON.parse(raw) as RegisterBody
  } catch {
    return NextResponse.json(
      { error: "Dados inválidos" },
      { status: 400 }
    )
  }

  if (!body.email || !body?.password) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(`${FUSIONAUTH_ISSUER}/api/user/registration`, {
      method: "POST",
      headers: {
        Authorization: FUSIONAUTH_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: {
          email: body.email,
          firstName: body.firstName || "",
          lastName: body.lastName || "",
          password: body.password,
        },
        registration: {
          applicationId: FUSIONAUTH_APP_ID,
        },
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const message =
        data?.fieldErrors?.user?.email?.[0] ||
        data?.generalErrors?.[0]?.code ||
        data?.generalErrors?.[0]?.message ||
        "Não foi possível criar a conta"
      return NextResponse.json({ error: message }, { status: res.status })
    }

    return NextResponse.json({
      ok: true,
      userId: data?.user?.id,
    })
  } catch {
    return NextResponse.json(
      { error: "Erro ao conectar com o serviço de autenticação" },
      { status: 502 }
    )
  }
}
