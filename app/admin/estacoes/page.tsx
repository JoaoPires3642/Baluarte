import { AdminStationDeliveryForm } from "@/components/admin-station-delivery-form"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export default async function AdminStationDeliveryPage() {
  const payload = await fetchSettings()

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">Entrega em Estações</h1>
      </div>
      <AdminStationDeliveryForm initialSettings={payload?.data || null} />
    </div>
  )
}

async function fetchSettings() {
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

    return response.ok
      ? (await response.json() as { data: StationDeliveryAdminData })
      : null
  } catch {
    return null
  }
}

interface StationDeliveryAdminData {
  enabled: boolean
  price: number
  stations: Record<string, string[]>
  timeSlots: string[]
}
