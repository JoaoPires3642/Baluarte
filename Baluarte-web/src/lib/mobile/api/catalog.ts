import { ApiClient } from "./client";
import type { CategoryDto, TeamDto, CatalogModelDto, CatalogModelDetailDto } from "./contracts";
import { shouldUseMockCategories } from "../env";
import { SHARED_MOCK_CATEGORIES } from "@/shared/catalog/mock-categories";
import { products, teams } from "@/lib/data";

const defaultClient = new ApiClient();
const INACTIVE_TEAM_IDS = new Set(["barcelona"]);

type CatalogModelApiDto = {
  id: string;
  teamSlug: string;
  modelName: string;
  description?: string;
  thumbnailUrl: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  customizationEnabled?: boolean;
  customizationTemplatePng?: string;
  customizationTemplateMetadata?: string;
  available: boolean;
  stockQuantity: number;
  variants: {
    size: "P" | "M" | "G" | "GG";
    stockQuantity: number;
    available: boolean;
  }[];
};

type CatalogModelDetailApiDto = {
  id: string;
  teamSlug: string;
  modelName: string;
  description?: string;
  thumbnailUrl: string;
  images: string[];
  price: number;
  originalPrice?: number;
  customizationEnabled?: boolean;
  customizationTemplatePng?: string;
  customizationTemplateMetadata?: string;
  available: boolean;
  stockQuantity: number;
  variants: {
    size: "P" | "M" | "G" | "GG";
    stockQuantity: number;
    available: boolean;
  }[];
};

export async function fetchPublicCategories(client: ApiClient = defaultClient): Promise<CategoryDto[]> {
  if (shouldUseMockCategories()) {
    return SHARED_MOCK_CATEGORIES.map((category) => ({
      id: category.slug,
      name: category.name,
      slug: category.slug
    }));
  }

  const response = await client.request<CategoryDto[]>("/catalog/categories");
  return response.data;
}

export async function fetchPublicTeamsByCategory(
  categorySlug: string,
  client: ApiClient = defaultClient
): Promise<TeamDto[]> {
  if (shouldUseMockCategories()) {
    return teams
      .filter((team) => team.category === categorySlug && !INACTIVE_TEAM_IDS.has(team.id))
      .map((team, index) => ({
        id: team.id,
        name: team.name,
        slug: team.id,
        logo: team.logo,
        categorySlug: team.category,
        league: team.league,
        displayOrder: index + 1
      }));
  }

  const response = await client.request<TeamDto[]>(`/catalog/categories/${encodeURIComponent(categorySlug)}/teams`);
  return response.data;
}

export async function fetchPublicModelsByTeam(teamSlug: string, client: ApiClient = defaultClient): Promise<CatalogModelDto[]> {
  if (shouldUseMockCategories()) {
    return products
      .filter((product) => product.teamId === teamSlug && product.inStock)
      .map((product, index) => ({
        id: product.id,
        name: product.name,
        slug: product.id,
        teamSlug,
        thumbnailUrl: product.image,
        displayOrder: index + 1,
        price: product.price,
        originalPrice: product.originalPrice,
        available: product.inStock,
        stockQuantity: Object.values(product.stockBySize ?? {}).reduce((sum, units) => sum + Math.max(0, units), 0),
        variants: (product.sizes ?? ["P", "M", "G", "GG"]).map((size) => {
          const stockQuantity = Math.max(0, product.stockBySize?.[size] ?? 0);
          return {
            size,
            stockQuantity,
            available: stockQuantity > 0
          };
        })
      }));
  }

  const response = await client.request<CatalogModelApiDto[]>(`/catalog/teams/${encodeURIComponent(teamSlug)}/models`);
  return response.data.map((item, index) => ({
    id: item.id,
    name: item.modelName,
    slug: item.id,
    description: item.description,
    teamSlug: item.teamSlug,
    thumbnailUrl: item.thumbnailUrl,
    images: item.images,
    displayOrder: index + 1,
    price: item.price,
    originalPrice: item.originalPrice,
    customizationEnabled: item.customizationEnabled,
    customizationTemplatePng: item.customizationTemplatePng,
    customizationTemplateMetadata: item.customizationTemplateMetadata,
    available: item.available,
    stockQuantity: item.stockQuantity,
    variants: item.variants
  }));
}

export async function fetchPublicModelDetail(
  teamSlug: string,
  modelId: string,
  client: ApiClient = defaultClient
): Promise<CatalogModelDetailDto> {
  if (shouldUseMockCategories()) {
    const product = products.find((item) => item.id === modelId && item.teamId === teamSlug);
    if (!product) {
      throw new Error("Modelo nao encontrado");
    }

    const variants = (product.sizes ?? ["P", "M", "G", "GG"]).map((size) => {
      const stockQuantity = Math.max(0, product.stockBySize?.[size] ?? 0);
      return {
        size,
        stockQuantity,
        available: stockQuantity > 0
      };
    });

    return {
      id: product.id,
      slug: product.id,
      name: product.name,
      teamSlug,
      thumbnailUrl: product.image,
      images: product.images?.length ? product.images : [product.image],
      price: product.price,
      originalPrice: product.originalPrice,
      available: product.inStock,
      stockQuantity: variants.reduce((sum, item) => sum + item.stockQuantity, 0),
      variants
    };
  }

  const response = await client.request<CatalogModelDetailApiDto>(
    `/catalog/teams/${encodeURIComponent(teamSlug)}/models/${encodeURIComponent(modelId)}`
  );

  return {
    id: response.data.id,
    slug: response.data.id,
    name: response.data.modelName,
    description: response.data.description,
    teamSlug: response.data.teamSlug,
    thumbnailUrl: response.data.thumbnailUrl,
    images: response.data.images,
    price: response.data.price,
    originalPrice: response.data.originalPrice,
    customizationEnabled: response.data.customizationEnabled,
    customizationTemplatePng: response.data.customizationTemplatePng,
    customizationTemplateMetadata: response.data.customizationTemplateMetadata,
    available: response.data.available,
    stockQuantity: response.data.stockQuantity,
    variants: response.data.variants
  };
}
