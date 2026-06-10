import { AdminContactSettingsForm } from "@/components/admin-contact-settings-form"
import type { SiteContactSettings } from "@/lib/api"
import { auth, currentUser } from "@clerk/nextjs/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

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
  const settings = await fetchSettings()

  return (
    <div className="space-y-6 py-6">
      <div>
        <p className="eyebrow">Configuracao</p>
        <h1 className="mt-1 text-2xl font-bold">Contato e Redes</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Configure mensagem, canais de atendimento e redes sociais exibidos no rodape do site.
        </p>
      </div>
      <AdminContactSettingsForm initialSettings={settings} />
    </div>
  )
}

async function fetchSettings() {
  const { userId, getToken } = await auth()
  const user = await currentUser()
  const token = await getToken()
  const email = user?.emailAddresses?.[0]?.emailAddress || ""

  const response = await fetch(`${API_BASE_URL}/admin/contact-settings`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-Clerk-User-Id": userId || "",
      "X-Clerk-Email": email,
    },
    cache: "no-store",
  })

  if (!response.ok) return fallbackSettings
  const payload = await response.json() as { data: SiteContactSettings }
  return payload.data
}
