import type { Team } from "@/lib/types";
import type { AdminProduct } from "@/pages/admin/types";

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

export type ListAdminProductsApiOptions = CreateAdminProductApiOptions;

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

export async function listAdminProductsApi(options: ListAdminProductsApiOptions = {}): Promise<AdminProductDto[]> {
  const client = options.client ?? defaultClient;

  const response = await client.request<AdminProductDto[]>("/admin/products", {
    method: "GET",
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

export function mapAdminProductDtoToAdminProduct(dto: AdminProductDto, teams: Team[]): AdminProduct {
  const resolvedTeam = resolveTeamBySlug(dto.teamSlug, teams) ?? {
    id: dto.teamSlug,
    name: dto.teamSlug,
    logo: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=300&q=80",
    category: dto.categorySlug,
    league: undefined
  };
  const stockBySize = (["P", "M", "G", "GG"] as const).reduce<Record<"P" | "M" | "G" | "GG", number>>((accumulator, size) => {
    const variant = dto.variants.find((item) => item.size === size);
    accumulator[size] = variant?.stockQuantity ?? 0;
    return accumulator;
  }, { P: 0, M: 0, G: 0, GG: 0 });

  return {
    id: dto.id,
    name: dto.modelName,
    description: dto.description,
    teamId: resolvedTeam.id,
    team: resolvedTeam,
    sizes: ["P", "M", "G", "GG"],
    price: dto.price,
    originalPrice: dto.originalPrice,
    stockBySize,
    stockQuantity: dto.stockQuantity,
    inStock: dto.active && dto.stockQuantity > 0,
    image: dto.imageUrl,
    images: [dto.imageUrl],
    customizationEnabled: dto.customizationEnabled,
    customizationTemplatePng: dto.customizationTemplatePng,
    featured: false
  };
}
