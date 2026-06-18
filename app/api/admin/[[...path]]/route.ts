import { getAuthHeaders } from "@/lib/auth-headers"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const DEFAULT_API_BASE = "http://localhost:8080/api/v1"
const API_BASE = process.env.BACKEND_INTERNAL_URL || (process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_API_BASE_URL : DEFAULT_API_BASE)

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
  const { path } = await paramsPromise
  const pathStr = path && path.length > 0 ? `/${path.join("/")}` : ""
  const url = `${API_BASE}${pathStr}${req.nextUrl.search}`

  const { headers } = await getAuthHeaders()

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
