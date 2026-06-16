import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Não autenticado" } }, { status: 401 })
  }

  const response = await fetch(`${API_BASE_URL}/orders/my`, {
    headers: {
      Accept: "application/json",
      "X-User-Id": session.user.id,
      "X-User-Email": session.user.email ?? "",
    },
    cache: "no-store",
  })
  const body = await response.text()

  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
  })
}
