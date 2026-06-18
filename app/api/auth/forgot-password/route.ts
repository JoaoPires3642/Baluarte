import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const FUSIONAUTH_ISSUER = process.env.FUSIONAUTH_ISSUER!
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY!
const FUSIONAUTH_APP_ID = process.env.FUSIONAUTH_CLIENT_ID!
const RESEND_API_KEY = process.env.RESEND_API_KEY!

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

    const resetLink = `https://dombaluarte.com.br/redefinir-senha?token=${changePasswordId}`

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Baluarte <contato@dombaluarte.com.br>",
        to: [email.trim().toLowerCase()],
        subject: "Redefina sua senha - Baluarte",
        html: `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="background: #0f274d; padding: 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Baluarte</h1>
    </div>
    <div style="padding: 30px;">
      <h2 style="color: #0f274d;">Redefinir senha</h2>
      <p style="color: #475569;">Recebemos uma solicita\u00e7\u00e3o para redefinir sua senha. Clique no bot\u00e3o abaixo para criar uma nova senha:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background: #0f274d; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">Redefinir senha</a>
      </div>
      <p style="color: #475569; font-size: 14px;">Se voc\u00ea n\u00e3o solicitou esta altera\u00e7\u00e3o, ignore este email.</p>
      <p style="color: #94a3b8; font-size: 12px;">Este link expira em 10 minutos.</p>
    </div>
  </div>
</body>
</html>`,
        text: `Redefina sua senha - Baluarte\n\nRecebemos uma solicita\u00e7\u00e3o para redefinir sua senha. Copie e cole o link abaixo no seu navegador:\n\n${resetLink}\n\nSe voc\u00ea n\u00e3o solicitou esta altera\u00e7\u00e3o, ignore este email.\n\nEste link expira em 10 minutos.`,
      }),
    })

    if (!resendRes.ok) {
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
