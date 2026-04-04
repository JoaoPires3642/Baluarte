import { slugifyCategory } from "./admin-categories";
import { VALID_SIZES, slugifyEntity } from "./admin-utils";
import type { AdminCategory, Product, Size, Team } from "./types";

type AdminProductDraft = Product & {
  stockQuantity: number;
  stockBySize: Record<Size, number>;
};

export const createCategory = (name: string, logo: string): AdminCategory => {
  const nextName = name.trim();
  const nextLogo = logo.trim();

  return {
    slug: slugifyCategory(nextName),
    name: nextName,
    logo: nextLogo
  };
};

export const createTeam = (name: string, logo: string, league: string, category: string): Team => {
  return {
    id: slugifyEntity(name),
    name: name.trim(),
    category,
    league: league.trim() || undefined,
    logo: logo.trim()
  };
};

export const parseProductSizes = (sizes: string): Size[] => {
  const parsed = sizes
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is Size => VALID_SIZES.includes(item as Size));

  return parsed.length > 0 ? parsed : ["M"];
};

export const createAdminProduct = (
  name: string,
  description: string,
  parsedPrice: number,
  imageUris: string[],
  selectedTeam: Team,
  stockBySize: Record<Size, number>,
  originalPrice?: number,
  customizationEnabled: boolean = false,
  customizationTemplatePng?: string
): AdminProductDraft => {
  const idBase = slugifyEntity(name);
  const id = `${idBase}-${Date.now().toString().slice(-5)}`;
  const normalizedImages = imageUris.map((item) => item.trim()).filter(Boolean);
  const fallbackImage = "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop";
  const images = normalizedImages.length > 0 ? normalizedImages : [fallbackImage];

  const normalizedStockBySize = (Object.keys(stockBySize) as Size[]).reduce<Record<Size, number>>((acc, key) => {
    acc[key] = Math.max(0, stockBySize[key] ?? 0);
    return acc;
  }, { P: 0, M: 0, G: 0, GG: 0 });
  const stockQuantity = Object.values(normalizedStockBySize).reduce((sum, value) => sum + value, 0);

  return {
    id,
    name: name.trim(),
    description: description.trim(),
    price: parsedPrice,
    originalPrice,
    image: images[0],
    images,
    customizationEnabled,
    customizationTemplatePng: customizationEnabled ? customizationTemplatePng : undefined,
    teamId: selectedTeam.id,
    team: selectedTeam,
    sizes: ["P", "M", "G", "GG"],
    stockBySize: normalizedStockBySize,
    inStock: stockQuantity > 0,
    stockQuantity,
    featured: false
  };
};
