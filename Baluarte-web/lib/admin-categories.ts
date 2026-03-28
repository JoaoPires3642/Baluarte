import { AdminCategory, Category } from "./types";

export const CATEGORY_STORAGE_KEY = "admin_categories_v1";

export const defaultCategories: AdminCategory[] = [
  {
    slug: "nacionais",
    name: "Nacionais",
    logo: "https://assets.football-logos.cc/logos/brazil/512x512/brazil.efd0f76d.png",
  },
  {
    slug: "internacionais",
    name: "Internacionais",
    logo: "https://assets.football-logos.cc/logos/fifa/512x512/fifa.54de36a8.png",
  },
  {
    slug: "selecoes",
    name: "Selecoes",
    logo: "https://assets.football-logos.cc/logos/fifa/512x512/world-cup.4fe7d3a4.png",
  },
];

export const slugifyCategory = (value: string): Category => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

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
