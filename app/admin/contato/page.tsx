import { AdminContactSettingsForm } from "@/components/admin-contact-settings-form"
import type { SiteContactSettings } from "@/lib/api"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

const API_BASE_URL = process.env.BACKEND_INTERNAL_URL || (process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_API_BASE_URL : "http://localhost:8080/api/v1")

const fallbackSettings: SiteContactSettings = {
  footerMessage: "Loja com curadoria premium, atendimento consultivo e coleções esportivas para quem veste o time com identidade.",
  email: "contato@baluarte.com.br",
  phone: "(11) 99999-9999",
  whatsapp: "(11) 99999-9999",
  businessHours: "Seg a Sex, 9h às 18h",
  instagramUrl: "https://instagram.com",
  facebookUrl: "https://facebook.com",
  youtubeUrl: "https://youtube.com",
  whatsappMessage: "Ola! Gostaria de mais informacoes sobre os produtos da Baluarte.",
}

export default async function AdminContactSettingsPage() {
  const result = await fetchSettings()

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">Contato e Redes</h1>
      </div>
      {result.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Erro ao carregar configurações</p>
          <p className="mt-1 text-red-600">{result.error}</p>
        </div>
      )}
      <AdminContactSettingsForm initialSettings={result.data} />
    </div>
  )
}

async function fetchSettings(): Promise<{ data: SiteContactSettings; error?: string }> {
  try {
    const session = await getServerSession(authOptions)

    const response = await fetch(`${API_BASE_URL}/admin/contact-settings`, {
      headers: {
        Accept: "application/json",
        "X-User-Id": session?.user?.id || "",
        "X-User-Email": session?.user?.email || "",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      return {
        data: fallbackSettings,
        error: `HTTP ${response.status} ${response.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
      }
    }

    const payload = await response.json() as { data: SiteContactSettings }
    return { data: payload.data }
  } catch (err) {
    return {
      data: fallbackSettings,
      error: err instanceof Error ? err.message : "Erro de rede ao carregar",
    }
  }
}
