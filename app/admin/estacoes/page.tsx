import { AdminStationDeliveryForm } from "@/components/admin-station-delivery-form"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

export default async function AdminStationDeliveryPage() {
  const session = await getServerSession(authOptions)

  const response = await fetch(`${API_BASE_URL}/admin/station-delivery/settings`, {
    headers: {
      Accept: "application/json",
      "X-User-Id": session?.user?.id || "",
      "X-User-Email": session?.user?.email || "",
    },
    cache: "no-store",
  })

  const payload = response.ok
    ? (await response.json() as { data: StationDeliveryAdminData })
    : null

  return (
    <div className="space-y-6 py-6">
      <div>
        <p className="eyebrow">Configuracao</p>
        <h1 className="mt-1 text-2xl font-bold">Entrega em Estacoes</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Configure a opcao de entrega em estacoes de metro, com dias da semana, estacoes, horarios e preco.
        </p>
      </div>
      <AdminStationDeliveryForm initialSettings={payload?.data || null} />
    </div>
  )
}

interface StationDeliveryAdminData {
  enabled: boolean
  price: number
  stations: Record<string, string[]>
  timeSlots: string[]
}
