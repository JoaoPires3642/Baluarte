import { useEffect, useMemo, useState } from "react";

import type { AdminProduct } from "../pages/admin/types";
import { fetchPublicCategories, fetchPublicTeamsByCategory } from "../lib/mobile/api/catalog";
import type { AdminCategory, Team } from "../lib/types";

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
