import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const API_BASE = process.env.BACKEND_INTERNAL_URL

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
  if (!API_BASE) {
    return NextResponse.json(
      { error: { code: "MISSING_CONFIG", message: "BACKEND_INTERNAL_URL não configurada" } },
      { status: 500 }
    )
  }
  const { path } = await paramsPromise
  const pathStr = path && path.length > 0 ? `/${path.join("/")}` : ""
  const url = `${API_BASE}${pathStr}${req.nextUrl.search}`

  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    if (["content-type", "authorization", "x-user-id", "x-user-email"].includes(key.toLowerCase())) {
      headers[key] = value
    }
  })

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
  } catch {
    return NextResponse.json(
      { error: { code: "PROXY_ERROR", message: "Erro ao conectar com o backend" } },
      { status: 502 }
    )
  }
}
