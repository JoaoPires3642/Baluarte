import { AdminShippingSettingsForm } from "@/components/admin-shipping-settings-form"
import { fetchAdminShippingSettings } from "@/lib/api"

export default async function AdminShippingSettingsPage() {
  const response = await fetchAdminShippingSettings()

  return (
    <div className="space-y-6 py-6">
      <div>
        <p className="eyebrow">Configuracao</p>
        <h1 className="mt-1 text-2xl font-bold">Frete e Etiquetas</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Ajuste SuperFrete, pacote padrao e dados do remetente usados no calculo de frete e na geracao de etiquetas.
        </p>
      </div>
      <AdminShippingSettingsForm initialSettings={response.data} />
    </div>
  )
}
