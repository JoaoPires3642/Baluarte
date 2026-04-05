import { ApiClient } from "./client";
import type { CategoryDto, TeamDto, CatalogModelDto } from "./contracts";
import { shouldUseMockCategories } from "../env";
import { SHARED_MOCK_CATEGORIES } from "@/shared/catalog/mock-categories";
import { products, teams } from "@/lib/data";

const defaultClient = new ApiClient();
const INACTIVE_TEAM_IDS = new Set(["barcelona"]);

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
        imageUrl: product.image,
        displayOrder: index + 1
      }));
  }

  const response = await client.request<CatalogModelDto[]>(`/catalog/teams/${encodeURIComponent(teamSlug)}/products`);
  return response.data;
}
