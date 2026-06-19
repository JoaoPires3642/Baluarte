import { getAuthHeaders } from "@/lib/auth-headers"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const API_BASE_URL = process.env.BACKEND_INTERNAL_URL || (process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_API_BASE_URL : "http://localhost:8080/api/v1")

type Context = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params
  const { headers, userId } = await getAuthHeaders()

  if (!userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Não autenticado" } }, { status: 401 })
  }

  const response = await fetch(`${API_BASE_URL}/orders/my/${id}`, {
    headers: { ...headers, Accept: "application/json" },
    cache: "no-store",
  })
  const body = await response.text()

  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
  })
}
