import { useMemo, useState } from "react";

import { mockCoupons } from "../lib/data";
import type { Category, Coupon, Product, Team } from "../lib/types";
import { useAuthState } from "./useAuthState";
import { useCartState } from "./useCartState";
import { useInventoryState } from "./useInventoryState";
import { useOrdersState } from "./useOrdersState";

export type RouteState =
  | { name: "home" }
  | { name: "category"; slug: Category }
  | { name: "team"; id: string }
  | { name: "product"; id: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "login"; redirectAfterLogin?: "home" | "orders" | "checkout" | "profile"; authMode?: "login" | "register" }
  | { name: "profile" }
  | { name: "orders" }
  | { name: "admin" }
  | { name: "admin-dashboard" }
  | { name: "admin-categories" }
  | { name: "admin-teams" }
  | { name: "admin-products" }
  | { name: "admin-orders" }
  | { name: "admin-coupons" };

export type ScreenState = {
  title?: string;
  description?: string;
  teams?: Team[];
  team?: Team;
  products?: Product[];
  product?: Product;
} | null;

export function useAppState() {
  const [route, setRoute] = useState<RouteState>({ name: "home" });
  const { categories, setCategories, teamList, setTeamList, productList, setProductList, featuredProducts } = useInventoryState();
  const {
    cartItems,
    shipping,
    setShipping,
    appliedCoupon,
    setAppliedCoupon,
    subtotal,
    discount,
    total,
    cartCount,
    addToCart,
    updateCartQuantity,
    clearCart
  } = useCartState();
  const { user, setUser, handleLogin, handleRegister, updateUserAddress, accountLabel } = useAuthState();
  const { orders, setOrders } = useOrdersState();

  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);

  const screen = useMemo<ScreenState>(() => {
    if (route.name === "category") {
      return {
        title:
          route.slug === "nacionais"
            ? "Times Nacionais"
            : route.slug === "internacionais"
              ? "Times Internacionais"
              : "Selecoes",
        description:
          route.slug === "nacionais"
            ? "Os maiores times do futebol brasileiro"
            : route.slug === "internacionais"
              ? "Os gigantes do futebol mundial"
              : "As maiores selecoes do planeta",
        teams: teamList.filter((team) => team.category === route.slug)
      };
    }

    if (route.name === "team") {
      const team = teamList.find((item) => item.id === route.id);
      return {
        team,
        products: team ? productList.filter((product) => product.teamId === team.id) : []
      };
    }

    if (route.name === "product") {
      return {
        product: productList.find((item) => item.id === route.id)
      };
    }

    return null;
  }, [route, teamList, productList]);

  const inAdminArea =
    route.name === "admin" ||
    route.name === "admin-dashboard" ||
    route.name === "admin-categories" ||
    route.name === "admin-teams" ||
    route.name === "admin-products" ||
    route.name === "admin-orders" ||
    route.name === "admin-coupons";

  return {
    route,
    setRoute,
    categories,
    setCategories,
    teamList,
    setTeamList,
    productList,
    setProductList,
    coupons,
    setCoupons,
    cartItems,
    shipping,
    setShipping,
    appliedCoupon,
    setAppliedCoupon,
    user,
    setUser,
    orders,
    setOrders,
    featuredProducts,
    subtotal,
    discount,
    total,
    cartCount,
    addToCart,
    updateCartQuantity,
    clearCart,
    handleLogin,
    handleRegister,
    updateUserAddress,
    screen,
    inAdminArea,
    accountLabel
  };
}

export type AppState = ReturnType<typeof useAppState>;
