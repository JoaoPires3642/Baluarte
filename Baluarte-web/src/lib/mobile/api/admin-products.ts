import type { Size, Team } from "@/lib/types";
import type { AdminProduct } from "@/pages/admin/types";

import type { ApiAuthorizationContext } from "./contracts";
import { ApiClient } from "./client";

const defaultClient = new ApiClient();
const PRODUCT_SIZES: Size[] = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"];

export type CreateAdminProductVariantPayload = {
  size: "P" | "M" | "G" | "GG" | "G1" | "G2" | "G3" | "G4";
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
  customizationTemplateMetadata?: string;
  variants: CreateAdminProductVariantPayload[];
};

export type UpdateAdminProductPayload = CreateAdminProductPayload;

type AdminProductVariantDto = {
  size: "P" | "M" | "G" | "GG" | "G1" | "G2" | "G3" | "G4";
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
  customizationTemplateMetadata?: string;
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

export async function listAdminProductsApi(options: CreateAdminProductApiOptions = {}): Promise<AdminProductDto[]> {
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
  const stockBySize = PRODUCT_SIZES.reduce<Record<Size, number>>((accumulator, size) => {
    const variant = dto.variants.find((item) => item.size === size);
    accumulator[size] = variant?.stockQuantity ?? 0;
    return accumulator;
  }, Object.fromEntries(PRODUCT_SIZES.map((size) => [size, 0])) as Record<Size, number>);

  return {
    id: dto.id,
    name: dto.modelName,
    description: dto.description,
    teamId: resolvedTeam.id,
    team: resolvedTeam,
    sizes: PRODUCT_SIZES,
    price: dto.price,
    originalPrice: dto.originalPrice,
    stockBySize,
    stockQuantity: dto.stockQuantity,
    inStock: dto.active && dto.stockQuantity > 0,
    image: dto.imageUrl,
    images: [dto.imageUrl],
    customizationEnabled: dto.customizationEnabled,
    customizationTemplatePng: dto.customizationTemplatePng,
    customizationTemplateMetadata: dto.customizationTemplateMetadata,
    featured: false
  };
}
