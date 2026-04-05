import { useEffect, useMemo, useState } from "react";

import type { AdminProduct } from "../pages/admin/types";
import { VALID_SIZES } from "../lib/admin-utils";
import { fetchPublicCategories, fetchPublicTeamsByCategory } from "../lib/mobile/api/catalog";
import type { AdminCategory, Product, Team } from "../lib/types";

const normalizeProducts = (items: Product[]): AdminProduct[] => {
  return items.map((item) => {
    const stockBySize = VALID_SIZES.reduce<Record<"P" | "M" | "G" | "GG", number>>((acc, size) => {
      const explicit = item.stockBySize?.[size];
      const fallback = item.sizes.includes(size) ? (item.inStock ? 10 : 0) : 0;
      acc[size] = Number.isFinite(explicit) ? Math.max(0, explicit as number) : fallback;
      return acc;
    }, { P: 0, M: 0, G: 0, GG: 0 });
    const quantity = Object.values(stockBySize).reduce((sum, value) => sum + value, 0);
    const images = item.images && item.images.length > 0 ? item.images : [item.image];
    return {
      ...item,
      image: images[0],
      images,
      stockBySize,
      stockQuantity: quantity,
      inStock: quantity > 0
    };
  });
};

export function useInventoryState() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [teamList, setTeamList] = useState<Team[]>([]);
  const [productList, setProductList] = useState<AdminProduct[]>([]);

  useEffect(() => {
    let active = true;

    const loadInventory = async (): Promise<void> => {
      try {
        const categoriesFromApi = await fetchPublicCategories();
        if (!active) {
          return;
        }

        setCategories(
          categoriesFromApi.map((category) => ({
            slug: category.slug,
            name: category.name,
            logo: ""
          }))
        );

        const teamsFromApi = await Promise.all(
          categoriesFromApi.map((category) => fetchPublicTeamsByCategory(category.slug))
        );

        if (!active) {
          return;
        }

        setTeamList(
          teamsFromApi
            .flat()
            .map((team) => ({
              id: team.slug,
              name: team.name,
              logo: team.logo ?? "",
              category: team.categorySlug,
              league: team.league
            }))
        );
      } catch {
        if (!active) {
          return;
        }

        setCategories([]);
        setTeamList([]);
      }
    };

    void loadInventory();

    return () => {
      active = false;
    };
  }, []);

  const featuredProducts = useMemo(() => productList.filter((product) => product.featured), [productList]);

  return {
    categories,
    setCategories,
    teamList,
    setTeamList,
    productList,
    setProductList,
    featuredProducts
  };
}
