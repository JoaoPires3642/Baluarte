import { AdminCategory, Category } from "./types";
import { SHARED_MOCK_CATEGORIES } from "@/shared/catalog/mock-categories";
import { slugify } from "./slugify";

export const CATEGORY_STORAGE_KEY = "admin_categories_v1";

export const defaultCategories: AdminCategory[] = SHARED_MOCK_CATEGORIES;

export const slugifyCategory = (value: string): Category => slugify(value);

export const normalizeCategories = (input: unknown): AdminCategory[] => {
  if (!Array.isArray(input)) {
    return defaultCategories;
  }

  const normalized = input
    .filter((item): item is Partial<AdminCategory> => typeof item === "object" && item !== null)
    .map((item) => {
      const slug = slugifyCategory(String(item.slug || ""));
      const name = String(item.name || "").trim();
      const logo = String(item.logo || "").trim();
      return {
        slug,
        name,
        logo,
      };
    })
    .filter((item) => item.slug.length > 0 && item.name.length > 0);

  if (normalized.length === 0) {
    return defaultCategories;
  }

  const seen = new Set<string>();
  return normalized.filter((item) => {
    if (seen.has(item.slug)) {
      return false;
    }
    seen.add(item.slug);
    return true;
  });
};

export const getCategoryName = (categories: AdminCategory[], slug: Category): string => {
  return categories.find((category) => category.slug === slug)?.name || slug;
};
