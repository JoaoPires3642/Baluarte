import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export async function POST(req: NextRequest) {
  let token = req.headers.get("X-Clerk-Session-Token") || null
  let resolvedUserId = req.headers.get("X-Clerk-User-Id") || null
  let resolvedEmail = req.headers.get("X-Clerk-Email") || null

  if (!token || !resolvedUserId) {
    const { userId, getToken } = await auth()
    if (!token) token = await getToken()
    if (!resolvedUserId) resolvedUserId = userId
  }

  if (!token || !resolvedUserId) {
    const sessionCookie = extractSessionCookie(req)
    if (sessionCookie) {
      token = sessionCookie
      const payload = decodeJwtPayload(sessionCookie)
      if (payload?.sub && typeof payload.sub === "string") resolvedUserId = payload.sub
    }
  }

  if (!token || !resolvedUserId) {
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

  if (!resolvedEmail) {
    resolvedEmail = extractEmailFromJwt(token)
  }

  try {
    const response = await fetch(`${API_BASE}/admin/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Clerk-User-Id": resolvedUserId,
        ...(resolvedEmail ? { "X-Clerk-Email": resolvedEmail } : {}),
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

function extractSessionCookie(req: NextRequest): string | null {
  const cookieHeader = req.headers.get("cookie")
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim()
    if (trimmed.startsWith("__session=")) {
      return trimmed.slice("__session=".length)
    }
  }
  return null
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function extractEmailFromJwt(token: string): string | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  const email = payload.email || payload.email_address
  return typeof email === "string" && email.includes("@") ? email : null
}
