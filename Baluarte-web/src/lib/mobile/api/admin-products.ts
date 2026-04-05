import type { Team } from "@/lib/types";

import type { ApiAuthorizationContext } from "./contracts";
import { ApiClient } from "./client";

const defaultClient = new ApiClient();

export type CreateAdminProductVariantPayload = {
  size: "P" | "M" | "G" | "GG";
  stockQuantity: number;
};

export type CreateAdminProductPayload = {
  categorySlug: string;
  teamSlug: string;
  modelName: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  customizationEnabled: boolean;
  customizationTemplatePng?: string;
  variants: CreateAdminProductVariantPayload[];
};

export type UpdateAdminProductPayload = CreateAdminProductPayload;

type AdminProductVariantDto = {
  size: "P" | "M" | "G" | "GG";
  stockQuantity: number;
  available: boolean;
};

type AdminProductDto = {
  id: string;
  categorySlug: string;
  teamSlug: string;
  modelName: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  customizationEnabled: boolean;
  customizationTemplatePng?: string;
  active: boolean;
  available: boolean;
  stockQuantity: number;
  variants: AdminProductVariantDto[];
};

export type CreateAdminProductApiOptions = {
  authorizationContext?: ApiAuthorizationContext;
  bearerToken?: string;
  client?: ApiClient;
};

export type UpdateAdminProductApiOptions = CreateAdminProductApiOptions;
export type DeleteAdminProductApiOptions = CreateAdminProductApiOptions;

export async function createAdminProductApi(
  payload: CreateAdminProductPayload,
  options: CreateAdminProductApiOptions = {}
): Promise<AdminProductDto> {
  const client = options.client ?? defaultClient;

  const response = await client.request<AdminProductDto>("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
    authorizationContext: options.authorizationContext,
    headers: options.bearerToken
      ? {
          Authorization: `Bearer ${options.bearerToken}`
        }
      : undefined
  });

  return response.data;
}

export async function updateAdminProductApi(
  productId: string,
  payload: UpdateAdminProductPayload,
  options: UpdateAdminProductApiOptions = {}
): Promise<AdminProductDto> {
  const client = options.client ?? defaultClient;

  const response = await client.request<AdminProductDto>(`/admin/products/${encodeURIComponent(productId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    authorizationContext: options.authorizationContext,
    headers: options.bearerToken
      ? {
          Authorization: `Bearer ${options.bearerToken}`
        }
      : undefined
  });

  return response.data;
}

export async function deleteAdminProductApi(
  productId: string,
  options: DeleteAdminProductApiOptions = {}
): Promise<AdminProductDto> {
  const client = options.client ?? defaultClient;

  const response = await client.request<AdminProductDto>(`/admin/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    authorizationContext: options.authorizationContext,
    headers: options.bearerToken
      ? {
          Authorization: `Bearer ${options.bearerToken}`
        }
      : undefined
  });

  return response.data;
}

export function resolveTeamBySlug(teamSlug: string, teams: Team[]): Team | undefined {
  return teams.find((team) => team.id === teamSlug);
}
