import { ApiClient } from "./client";
import type { ApiAuthorizationContext, ProfileAddressDto } from "./contracts";

const defaultClient = new ApiClient();

export type ProfileAddressApiOptions = {
  authorizationContext: ApiAuthorizationContext;
  bearerToken: string;
  client?: ApiClient;
};

export type ProfileAddressSyncPayload = {
  defaultAddressId?: string;
  addresses: {
    id?: string;
    label: string;
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  }[];
};

export async function listProfileAddressesApi(options: ProfileAddressApiOptions): Promise<ProfileAddressDto[]> {
  const client = options.client ?? defaultClient;
  const response = await client.request<ProfileAddressDto[]>("/profile/addresses", {
    method: "GET",
    authorizationContext: options.authorizationContext,
    headers: {
      Authorization: `Bearer ${options.bearerToken}`
    }
  });

  return response.data;
}

export async function syncProfileAddressesApi(
  payload: ProfileAddressSyncPayload,
  options: ProfileAddressApiOptions
): Promise<ProfileAddressDto[]> {
  const client = options.client ?? defaultClient;
  const response = await client.request<ProfileAddressDto[]>("/profile/addresses", {
    method: "PUT",
    body: JSON.stringify(payload),
    authorizationContext: options.authorizationContext,
    headers: {
      Authorization: `Bearer ${options.bearerToken}`
    }
  });

  return response.data;
}

export function mapProfileAddressDtoToAddress(dto: ProfileAddressDto) {
  return {
    id: dto.id,
    label: dto.label,
    cep: dto.cep,
    street: dto.street,
    number: dto.number,
    complement: dto.complement ?? undefined,
    neighborhood: dto.neighborhood,
    city: dto.city,
    state: dto.state
  };
}
