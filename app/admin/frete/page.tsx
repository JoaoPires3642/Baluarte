import { AdminShippingSettingsForm } from "@/components/admin-shipping-settings-form"
import { type AdminShippingSettings } from "@/lib/api"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

const API_BASE_URL = process.env.BACKEND_INTERNAL_URL || (process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_API_BASE_URL : "http://localhost:8080/api/v1")

export default async function AdminShippingSettingsPage() {
  const result = await fetchSettings()

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">Frete e Etiquetas</h1>
      </div>
      {result.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Erro ao carregar configurações</p>
          <p className="mt-1 text-red-600">{result.error}</p>
        </div>
      )}
      <AdminShippingSettingsForm initialSettings={result.data} />
    </div>
  )
}

async function fetchSettings(): Promise<{ data: AdminShippingSettings; error?: string }> {
  try {
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
      const body = await response.text().catch(() => "")
      return {
        data: {} as AdminShippingSettings,
        error: `HTTP ${response.status} ${response.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
      }
    }

    const payload = await response.json() as { data: AdminShippingSettings }
    return { data: payload.data }
  } catch (err) {
    return {
      data: {} as AdminShippingSettings,
      error: err instanceof Error ? err.message : "Erro de rede ao carregar",
    }
  }
}
