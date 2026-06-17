import { getAuthHeaders } from "@/lib/auth-headers"
import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export async function POST(request: NextRequest) {
  try {
    const { headers, userId } = await getAuthHeaders()
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Não autenticado" } }, { status: 401 })
    }

    const body = await request.text()
    const response = await fetch(`${API_BASE_URL}/payment/requests`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    })

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    })
  } catch {
    return NextResponse.json({ message: "Erro ao processar pagamento" }, { status: 500 })
  }
}
