import { ApiClient } from "./client";
import type { CategoryDto } from "./contracts";
import { shouldUseMockCategories } from "../env";
import { SHARED_MOCK_CATEGORIES } from "@/shared/catalog/mock-categories";

const defaultClient = new ApiClient();

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
