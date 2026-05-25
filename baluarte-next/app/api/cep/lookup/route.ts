export const runtime = "edge"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cep = request.nextUrl.searchParams.get("cep")
  if (!cep || !/^\d{8}$/.test(cep)) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await res.json()

    if (data.erro) {
      return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      cep: data.cep,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    })
  } catch {
    return NextResponse.json({ error: "Erro ao consultar CEP" }, { status: 502 })
  }
}
