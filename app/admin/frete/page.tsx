import { AdminShippingSettingsForm } from "@/components/admin-shipping-settings-form"
import { type AdminShippingSettings } from "@/lib/api"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export default async function AdminShippingSettingsPage() {
  const settings = await fetchSettings()

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">Frete e Etiquetas</h1>
      </div>
      <AdminShippingSettingsForm initialSettings={settings} />
    </div>
  )
}

async function fetchSettings() {
  const session = await getServerSession(authOptions)

  const response = await fetch(`${API_BASE_URL}/admin/shipping-settings`, {
    headers: {
      Accept: "application/json",
      "X-User-Id": session?.user?.id || "",
      "X-User-Email": session?.user?.email || "",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Erro ao carregar configuracoes de frete")
  }

  const payload = await response.json() as { data: AdminShippingSettings }
  return payload.data
}
