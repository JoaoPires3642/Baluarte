import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth()
  const token = await getToken()

  if (!userId || !token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Autenticação necessária" } },
      { status: 401 }
    )
  }

  const formData = await req.formData()
  const file = formData.get("file")
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Arquivo não enviado" } },
      { status: 400 }
    )
  }

  const backendForm = new FormData()
  backendForm.append("file", file)

  const email = extractEmailFromJwt(token)

  try {
    const response = await fetch(`${API_BASE}/admin/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Clerk-User-Id": userId,
        ...(email ? { "X-Clerk-Email": email } : {}),
      },
      body: backendForm,
    })

    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    return NextResponse.json(
      { error: { code: "PROXY_ERROR", message: "Erro ao conectar com o backend" } },
      { status: 502 }
    )
  }
}

function extractEmailFromJwt(token: string): string | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const payload = JSON.parse(atob(padded))
    return payload.email || payload.email_address || null
  } catch {
    return null
  }
}
