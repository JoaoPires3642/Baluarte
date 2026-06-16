import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const DEFAULT_API_BASE = "http://localhost:8080/api/v1"
const API_BASE = process.env.BACKEND_INTERNAL_URL || (process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_API_BASE_URL : DEFAULT_API_BASE)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const email = session?.user?.email

  if (!userId) {
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

  try {
    const response = await fetch(`${API_BASE}/admin/media/upload`, {
      method: "POST",
      headers: {
        "X-User-Id": userId,
        ...(email ? { "X-User-Email": email } : {}),
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
