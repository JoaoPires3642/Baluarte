import { useEffect, useMemo, useState } from "react";

import { mockCoupons } from "../lib/data";
import type { Category, Coupon, Product, Team } from "../lib/types";
import type { ApiAuthorizationContext } from "../lib/mobile/api/contracts";
import { getActiveClerkIdentity } from "../lib/clerkClient";
import { listAdminProductsApi, mapAdminProductDtoToAdminProduct } from "../lib/mobile/api/admin-products";
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
  | {
      name: "login";
      redirectAfterLogin?: "home" | "orders" | "checkout" | "profile";
      authMode?: "login" | "register";
      blockedAdminRoute?:
        | { name: "admin" }
        | { name: "admin-dashboard" }
        | { name: "admin-categories" }
        | { name: "admin-teams" }
        | { name: "admin-products" }
        | { name: "admin-orders" }
        | { name: "admin-coupons" };
    }
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

function computeScreenState(
  route: RouteState,
  teamList: Team[],
  productList: Product[],
  customizableTeamIds: Set<string>
): ScreenState {
  if (route.name === "category") {
    const categoryTeams = route.slug === "personalizado"
      ? teamList.filter((team) => customizableTeamIds.has(team.id))
      : teamList.filter((team) => team.category === route.slug);

    const CATEGORY_META: Record<string, { title: string; description: string }> = {
      nacionais: { title: "Times Nacionais", description: "Os maiores times do futebol brasileiro" },
      internacionais: { title: "Times Internacionais", description: "Os gigantes do futebol mundial" },
      selecoes: { title: "Selecoes", description: "As maiores selecoes do planeta" }
    };

    const meta = CATEGORY_META[route.slug] ?? {
      title: "Personalizado",
      description: "Escolha um time e personalize sua camisa."
    };

    return { ...meta, teams: categoryTeams };
  }

  if (route.name === "team") {
    const team = teamList.find((item) => item.id === route.id);
    return {
      team,
      products: team ? productList.filter((product) => product.teamId === team.id) : []
    };
  }

  if (route.name === "product") {
    return { product: productList.find((item) => item.id === route.id) };
  }

  return null;
}

export function useAppState() {
  const [route, setRoute] = useState<RouteState>({ name: "home" });
  const { categories, setCategories, teamList, setTeamList, productList, setProductList, featuredProducts } = useInventoryState();
  const {
    cartItems,
    shipping,
    setShipping,
    appliedCoupon,
    setAppliedCoupon,
    baseSubtotal,
    subtotal,
    customizationNameCount,
    customizationSubtotal,
    customizationNumberDigitCount,
    customizationNumberSubtotal,
    discount,
    total,
    cartCount,
    addToCart,
    updateCartQuantity,
    clearCart
  } = useCartState();
  const {
    user,
    setUser,
    authSession,
    setAuthSession,
    securityAuditEvents,
    recordSecurityEvent,
    handleLogout,
    handleLogin,
    startEmailOtpLogin,
    verifyEmailOtpLogin,
    startEmailOtpRegister,
    verifyEmailOtpRegister,
    loginWithClerkOAuth,
    handleRegister,
    updateUserAddress,
    updateUserAddresses,
    accountLabel
  } = useAuthState();
  const { orders, setOrders } = useOrdersState();

  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);

  useEffect(() => {
    if (!user || !authSession || user.role !== "admin" || authSession.internalRole !== "admin") {
      return;
    }

    let active = true;

    void (async () => {
      const clerkIdentity = await getActiveClerkIdentity();
      if (!active || !clerkIdentity?.sessionToken) {
        return;
      }

      const authorizationContext: ApiAuthorizationContext = {
        clerkIdentity: {
          clerkUserId: clerkIdentity.userId,
          email: clerkIdentity.email
        },
        internalRole: authSession.internalRole
      };

      const items = await listAdminProductsApi({
        bearerToken: clerkIdentity.sessionToken,
        authorizationContext
      });

      if (!active) {
        return;
      }

      setProductList(items.map((item) => mapAdminProductDtoToAdminProduct(item, teamList)));
    })().catch(() => {
      if (!active) {
        return;
      }
    });

    return () => {
      active = false;
    };
  }, [authSession, setProductList, teamList, user]);

  const customizableTeamIds = useMemo(() => {
    return new Set(
      productList
        .filter((product) => product.customizationEnabled && product.customizationTemplatePng)
        .map((product) => product.teamId)
    );
  }, [productList]);

  const screen = useMemo<ScreenState>(
    () => computeScreenState(route, teamList, productList, customizableTeamIds),
    [route, teamList, productList, customizableTeamIds]
  );

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
    baseSubtotal,
    user,
    setUser,
    authSession,
    setAuthSession,
    securityAuditEvents,
    recordSecurityEvent,
    handleLogout,
    orders,
    setOrders,
    featuredProducts,
    subtotal,
    customizationNameCount,
    customizationSubtotal,
    customizationNumberDigitCount,
    customizationNumberSubtotal,
    discount,
    total,
    cartCount,
    addToCart,
    updateCartQuantity,
    clearCart,
    handleLogin,
    startEmailOtpLogin,
    verifyEmailOtpLogin,
    startEmailOtpRegister,
    verifyEmailOtpRegister,
    loginWithClerkOAuth,
    handleRegister,
    updateUserAddress,
    updateUserAddresses,
    screen,
    inAdminArea,
    accountLabel
  };
}

export type AppState = ReturnType<typeof useAppState>;
