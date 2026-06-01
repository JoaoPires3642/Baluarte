import { AdminShippingSettingsForm } from "@/components/admin-shipping-settings-form"
import { type AdminShippingSettings } from "@/lib/api"
import { auth, currentUser } from "@clerk/nextjs/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export default async function AdminShippingSettingsPage() {
  const settings = await fetchSettings()

  return (
    <div className="space-y-6 py-6">
      <div>
        <p className="eyebrow">Configuracao</p>
        <h1 className="mt-1 text-2xl font-bold">Frete e Etiquetas</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Ajuste SuperFrete, pacote padrao e dados do remetente usados no calculo de frete e na geracao de etiquetas.
        </p>
      </div>
      <AdminShippingSettingsForm initialSettings={settings} />
    </div>
  )
}

async function fetchSettings() {
  const { userId, getToken } = await auth()
  const user = await currentUser()
  const token = await getToken()
  const email = user?.emailAddresses?.[0]?.emailAddress || ""

  const response = await fetch(`${API_BASE_URL}/admin/shipping-settings`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-Clerk-User-Id": userId || "",
      "X-Clerk-Email": email,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Erro ao carregar configuracoes de frete")
  }

  const payload = await response.json() as { data: AdminShippingSettings }
  return payload.data
}
