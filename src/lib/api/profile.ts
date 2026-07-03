import { apiFetch } from "@/lib/api-client"
import type { Address, CepLookupResult } from "./types"

type AddressApiResponse = Omit<Address, "addressId" | "userId"> & {
  id?: string
  addressId?: string
  userId?: string
}

function normalizeAddress(address: AddressApiResponse): Address {
  return {
    ...address,
    addressId: address.addressId || address.id || "",
    userId: address.userId || "",
  }
}

export async function lookupCep(cep: string): Promise<CepLookupResult> {
  const res = await apiFetch(`/api/cep/lookup?cep=${cep}`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || "Erro ao consultar CEP")
  }
  return res.json()
}

export async function fetchAddresses(): Promise<Address[]> {
  const res = await apiFetch("/api/profile/addresses")
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const errPayload = body?.error
    throw new Error(errPayload?.message || errPayload || "Erro ao carregar endereços")
  }
  const json = await res.json()
  return (json.data || []).map(normalizeAddress)
}

export async function syncAddresses(addresses: Array<{
  addressId?: string
  label: string
  recipientName?: string
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  isDefault: boolean
}>, defaultAddressId?: string) {
  const res = await apiFetch("/api/profile/addresses", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      addresses: addresses.map(({ addressId, ...address }) => ({
        ...address,
        id: addressId,
      })),
      defaultAddressId,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const errPayload = body?.error
    const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
    throw new Error((errPayload?.message || "Erro ao salvar endereços") + details)
  }
  const json = await res.json()
  return {
    ...json,
    data: (json.data || []).map(normalizeAddress),
  }
}
