import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

async function getAuthHeaders() {
  const { userId, getToken, sessionClaims } = await auth()
  if (!userId) return null

  const token = await getToken()
  const email = (sessionClaims?.email as string) || (sessionClaims?.email_address as string) || `${userId}@clerk.users`

  return {
    "Content-Type": "application/json",
    "X-Clerk-User-Id": userId,
    "Authorization": `Bearer ${token}`,
    "X-Clerk-Email": email,
  }
}

export async function GET() {
  const headers = await getAuthHeaders()
  if (!headers) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const res = await fetch(`${API_BASE}/profile/addresses`, { headers })
  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function PUT(request: NextRequest) {
  const headers = await getAuthHeaders()
  if (!headers) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const body = await request.text()
  const res = await fetch(`${API_BASE}/profile/addresses`, {
    method: "PUT",
    headers,
    body,
  })

  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}
