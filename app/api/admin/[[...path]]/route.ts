import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "GET")
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "POST")
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "PUT")
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "DELETE")
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "PATCH")
}

async function proxy(req: NextRequest, paramsPromise: Promise<{ path?: string[] }>, method: string) {
  const { userId, getToken } = await auth()
  const { path } = await paramsPromise
  const pathStr = path && path.length > 0 ? `/${path.join("/")}` : ""
  const url = `${API_BASE}${pathStr}${req.nextUrl.search}`

  const token = await getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (userId && token) {
    headers["X-Clerk-User-Id"] = userId
    headers["Authorization"] = `Bearer ${token}`
    const email = extractEmailFromJwt(token)
    if (email) {
      headers["X-Clerk-Email"] = email
    }
  }

  let body: BodyInit | undefined
  if (method !== "GET" && method !== "DELETE") {
    body = await req.text()
  }

  try {
    const response = await fetch(url, { method, headers, body })
    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Admin API proxy error:", err)
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
