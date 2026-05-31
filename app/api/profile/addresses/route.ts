import { auth, currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

async function getAuthHeaders() {
  const { userId, getToken, sessionClaims } = await auth()
  if (!userId) return null

  const token = await getToken()
  if (!token) return null

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase()
    || (sessionClaims?.email as string)
    || (sessionClaims?.email_address as string)
    || `${userId}@clerk.users`

  return {
    "Content-Type": "application/json",
    "X-Clerk-User-Id": userId,
    "Authorization": `Bearer ${token}`,
    "X-Clerk-Email": email,
  }
}

export async function GET() {
  try {
    const headers = await getAuthHeaders()
    if (!headers) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    return proxyProfileAddresses("GET", headers)
  } catch (err) {
    console.error("Profile addresses auth error:", err)
    return NextResponse.json(
      { error: { code: "AUTH_ERROR", message: "Erro ao validar autenticação" } },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const headers = await getAuthHeaders()
    if (!headers) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    return proxyProfileAddresses("PUT", headers, await request.text())
  } catch (err) {
    console.error("Profile addresses auth error:", err)
    return NextResponse.json(
      { error: { code: "AUTH_ERROR", message: "Erro ao validar autenticação" } },
      { status: 500 }
    )
  }
}

async function proxyProfileAddresses(method: "GET" | "PUT", headers: Record<string, string>, body?: string) {
  try {
    const res = await fetch(`${API_BASE}/profile/addresses`, { method, headers, body })
    const data = await res.text()
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Profile addresses API proxy error:", err)
    return NextResponse.json(
      { error: { code: "PROXY_ERROR", message: "Erro ao conectar com o backend" } },
      { status: 502 }
    )
  }
}
