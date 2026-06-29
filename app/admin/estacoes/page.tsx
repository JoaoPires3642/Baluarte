import { AdminStationDeliveryForm } from "@/components/admin-station-delivery-form"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export default async function AdminStationDeliveryPage() {
  const result = await fetchSettings()

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">Entrega em Estações</h1>
      </div>
      {result.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Erro ao carregar configurações</p>
          <p className="mt-1 text-red-600">{result.error}</p>
        </div>
      )}
      <AdminStationDeliveryForm initialSettings={result.data} />
    </div>
  )
}

async function fetchSettings(): Promise<{ data: StationDeliveryAdminData | null; error?: string }> {
  try {
    const session = await getServerSession(authOptions)

    const response = await fetch(`${API_BASE_URL}/admin/station-delivery/settings`, {
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
        data: null,
        error: `HTTP ${response.status} ${response.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
      }
    }

    const payload = await response.json() as { data: StationDeliveryAdminData }
    return { data: payload.data }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erro de rede ao carregar",
    }
  }
}

interface StationDeliveryAdminData {
  enabled: boolean
  price: number
  stations: Record<string, string[]>
  timeSlots: string[]
}
