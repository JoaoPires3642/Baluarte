import { Image, Pressable, Text, View } from "react-native";
import type { ImageStyle } from "react-native";
import { useState, useEffect, useRef } from "react";

import { SkeletonCard } from "../components/SkeletonCard";
import { AdminCategoriesScreen } from "./admin/AdminCategoriesScreen";
import { AdminCouponsScreen } from "./admin/AdminCouponsScreen";
import { AdminDashboardScreen } from "./admin/AdminDashboardScreen";
import { AdminOrdersScreen } from "./admin/AdminOrdersScreen";
import { AdminProductsScreen } from "./admin/AdminProductsScreen";
import { AdminScreen } from "./admin/AdminScreen";
import { AdminTeamsScreen } from "./admin/AdminTeamsScreen";
import { CartScreen } from "./storefront/CartScreen";
import { CheckoutScreen } from "./storefront/CheckoutScreen";
import { HomeScreen } from "./storefront/HomeScreen";
import { LoginScreen } from "./storefront/LoginScreen";
import { OrdersScreen } from "./storefront/OrdersScreen";
import { ProductScreen } from "./storefront/ProductScreen";
import { TeamScreen } from "./storefront/TeamScreen";
import { ProfileScreen } from "./storefront/ProfileScreen";
import type { AppState, RouteState } from "../hooks/useAppState";
import type { Address, Category, Order, Product, Size } from "../lib/types";
import { fetchPublicModelDetail, fetchPublicModelsByTeam, fetchPublicTeamsByCategory } from "../lib/mobile/api/catalog";
import { requestShippingQuotes } from "../lib/mobile/api/checkout";
import { getActiveClerkIdentity, resolveBackendSessionRole } from "../lib/clerkClient";
import styles from "../App.styles";

type AppRouteContentProps = {
  state: AppState;
  isDesktop?: boolean;
};

const PRODUCT_SIZES: Size[] = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"];

const emptyStockBySize = (): Record<Size, number> => Object.fromEntries(
  PRODUCT_SIZES.map((size) => [size, 0])
) as Record<Size, number>;

type HierarchyModelShape = {
  slug: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  images?: string[];
  price?: number;
  originalPrice?: number;
  customizationEnabled?: boolean;
  customizationTemplatePng?: string;
  customizationTemplateMetadata?: string;
  available?: boolean;
  stockQuantity?: number;
  variants?: {
    size: Size;
    stockQuantity: number;
    available: boolean;
  }[];
};

type CheckoutContext = {
  step: 1 | 2 | 3;
  selectedAddressId?: string;
  guestAddressDraft: Address | null;
};

type TeamCatalogFilters = {
  searchQuery: string;
  selectedSize: Size | null;
  inStockOnly: boolean;
  onSaleOnly: boolean;
};

type AdminRouteName = "admin" | "admin-dashboard" | "admin-categories" | "admin-teams" | "admin-products" | "admin-orders" | "admin-coupons";

export type AdminRouteState = Extract<RouteState, { name: AdminRouteName }>;
export type LoginRouteState = Extract<RouteState, { name: "login" }>;

const DEFAULT_TEAM_FILTERS: TeamCatalogFilters = {
  searchQuery: "",
  selectedSize: null,
  inStockOnly: false,
  onSaleOnly: false
};

const DEFAULT_CHECKOUT_CONTEXT: CheckoutContext = {
  step: 1,
  selectedAddressId: undefined,
  guestAddressDraft: null
};

export function isAdminRoute(route: RouteState): route is AdminRouteState {
  return (
    route.name === "admin" ||
    route.name === "admin-dashboard" ||
    route.name === "admin-categories" ||
    route.name === "admin-teams" ||
    route.name === "admin-products" ||
    route.name === "admin-orders" ||
    route.name === "admin-coupons"
  );
}

export function hasAdminRouteAccess(user: AppState["user"], authSession: AppState["authSession"]): boolean {
  return Boolean(user?.role === "admin" && authSession?.token && authSession.internalRole === "admin");
}

export function buildAdminRecoveryLoginRoute(blockedAdminRoute: AdminRouteState): LoginRouteState & { blockedAdminRoute: AdminRouteState } {
  return {
    name: "login",
    authMode: "login",
    blockedAdminRoute,
    redirectAfterLogin: undefined
  };
}

export function shouldResetCheckoutContextOnUserChange(
  previousUser: AppState["user"] | undefined,
  nextUser: AppState["user"]
): boolean {
  if (!previousUser || !nextUser) {
    return Boolean(previousUser) !== Boolean(nextUser);
  }

  return previousUser.id !== nextUser.id;
}

export function resolveCheckoutShippingAddress(
  user: AppState["user"],
  checkoutContext: { selectedAddressId?: string; guestAddressDraft: Address | null }
): Address | undefined {
  const selectedFromUser = user?.addresses?.find((address) => address.id === checkoutContext.selectedAddressId);
  if (selectedFromUser) {
    return selectedFromUser;
  }

  if (checkoutContext.guestAddressDraft) {
    return checkoutContext.guestAddressDraft;
  }

  const defaultFromUser = user?.addresses?.find((address) => address.id === user?.defaultAddressId);
  if (defaultFromUser) {
    return defaultFromUser;
  }

  return user?.defaultAddress;
}

export async function ensureCheckoutFinalizationAuthorized(
  user: AppState["user"],
  authSession: AppState["authSession"]
): Promise<{ ok: true } | { ok: false; requiresAuth: true }> {
  if (!user || !authSession?.token) {
    return { ok: false, requiresAuth: true };
  }

  if (authSession.provider !== "clerk") {
    return { ok: true };
  }

  try {
    const identity = await getActiveClerkIdentity();
    if (!identity?.sessionToken) {
      return { ok: false, requiresAuth: true };
    }

    const backendSession = await resolveBackendSessionRole(identity);
    if (!backendSession.ok) {
      return { ok: false, requiresAuth: true };
    }

    return { ok: true };
  } catch {
    return { ok: false, requiresAuth: true };
  }
}

export function filterCatalogProducts(products: Product[], filters: TeamCatalogFilters): Product[] {
  const normalizedSearch = filters.searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    if (normalizedSearch) {
      const searchable = `${product.name} ${product.team.name}`.toLowerCase();
      if (!searchable.includes(normalizedSearch)) {
        return false;
      }
    }

    if (filters.inStockOnly) {
      const totalStock = Object.values(product.stockBySize ?? {}).reduce((sum, units) => sum + Math.max(0, units), 0);
      if (!product.inStock || totalStock <= 0) {
        return false;
      }
    }

    if (filters.onSaleOnly && !product.originalPrice) {
      return false;
    }

    if (filters.selectedSize) {
      const stockForSize = product.stockBySize?.[filters.selectedSize] ?? 0;
      if (stockForSize <= 0) {
        return false;
      }
    }

    return true;
  });
}

export function mapHierarchyModelToProduct(
  model: HierarchyModelShape,
  selectedTeam: Product["team"],
  teamProducts: Product[]
): Product {
  const localMatch = teamProducts.find((product) => product.id === model.slug);
  const primaryImage = model.images?.[0] ?? model.thumbnailUrl;
  const variantStockBySize = emptyStockBySize();
  if (model.variants?.length) {
    model.variants.forEach((variant) => {
      variantStockBySize[variant.size] = Math.max(0, variant.stockQuantity);
    });
  }

  const apiStockQuantity = model.variants?.length
    ? Object.values(variantStockBySize).reduce((sum, quantity) => sum + quantity, 0)
    : Math.max(0, model.stockQuantity ?? 0);

  const apiVariantAvailability = model.variants?.some((variant) => variant.available && variant.stockQuantity > 0) ?? false;
  const apiInStock = Boolean(model.available ?? (apiStockQuantity > 0));
  const resolvedInStock = model.variants?.length ? apiVariantAvailability : apiInStock;

  if (localMatch) {
    return {
      ...localMatch,
      id: model.slug,
      name: model.name,
      description: model.description ?? localMatch.description,
      price: model.price ?? localMatch.price,
      originalPrice: model.originalPrice ?? localMatch.originalPrice,
      image: primaryImage ?? localMatch.image,
      images: model.images?.length ? model.images : primaryImage ? [primaryImage] : localMatch.images,
      customizationEnabled: model.customizationEnabled ?? localMatch.customizationEnabled,
      customizationTemplatePng: model.customizationTemplatePng ?? localMatch.customizationTemplatePng,
      customizationTemplateMetadata: model.customizationTemplateMetadata ?? localMatch.customizationTemplateMetadata,
      stockBySize: model.variants?.length ? variantStockBySize : localMatch.stockBySize,
      inStock: resolvedInStock,
      team: selectedTeam,
      teamId: selectedTeam.id
    };
  }

  return {
    id: model.slug,
    name: model.name,
    description: model.description ?? "Modelo oficial disponivel no catalogo.",
    price: model.price ?? 0,
    originalPrice: model.originalPrice,
    image: primaryImage ?? "",
    images: model.images?.length ? model.images : primaryImage ? [primaryImage] : undefined,
    customizationEnabled: model.customizationEnabled,
    customizationTemplatePng: model.customizationTemplatePng,
    customizationTemplateMetadata: model.customizationTemplateMetadata,
    teamId: selectedTeam.id,
    team: selectedTeam,
    sizes: PRODUCT_SIZES,
    stockBySize: model.variants?.length ? variantStockBySize : { ...emptyStockBySize(), GG: apiStockQuantity },
    inStock: resolvedInStock
  };
}

export function mergeHierarchyModelsWithLocalProducts(
  models: HierarchyModelShape[],
  selectedTeam: Product["team"],
  teamProducts: Product[]
): Product[] {
  const mappedProducts = models.map((model) => mapHierarchyModelToProduct(model, selectedTeam, teamProducts));
  const includedIds = new Set(mappedProducts.map((product) => product.id));

  const localOnlyProducts = teamProducts
    .filter((product) => product.teamId === selectedTeam.id && product.inStock && !includedIds.has(product.id))
    .map((product) => ({
      ...product,
      team: selectedTeam,
      teamId: selectedTeam.id
    }));

  return [...mappedProducts, ...localOnlyProducts];
}

function redirectAfterLogin(
  route: RouteState & { blockedAdminRoute?: AdminRouteState; redirectAfterLogin?: string },
  setRoute: (route: RouteState) => void,
  internalRole?: string
): void {
  const isAdmin = internalRole === "admin";
  if (isAdmin && route.blockedAdminRoute) {
    setRoute(route.blockedAdminRoute);
    return;
  }
  if (isAdmin) {
    setRoute({ name: "admin" });
    return;
  }
  if (route.redirectAfterLogin === "checkout") {
    setRoute({ name: "checkout" });
    return;
  }
  if (route.redirectAfterLogin === "profile") {
    setRoute({ name: "profile" });
    return;
  }
  if (route.redirectAfterLogin === "orders") {
    setRoute({ name: "orders" });
    return;
  }
  setRoute({ name: "profile" });
}

function routeToAdminTeamUpdateFn(
  setTeamList: (teams: import("../hooks/useAppState").AppState["teamList"]) => void,
  setProductList: (update: import("../hooks/useAppState").AppState["productList"] | ((prev: import("../hooks/useAppState").AppState["productList"]) => import("../hooks/useAppState").AppState["productList"])) => void
) {
  return (nextTeams: import("../hooks/useAppState").AppState["teamList"]) => {
    setTeamList(nextTeams);
    setProductList((prev) =>
      prev.map((product) => {
        const nextTeam = nextTeams.find((team) => team.id === product.teamId);
        if (!nextTeam) {
          return product;
        }
        return { ...product, teamId: nextTeam.id, team: nextTeam };
      })
    );
  };
}

export function AppRouteContent({ state }: AppRouteContentProps) {
  const {
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
    authSession,
    recordSecurityEvent,
    baseSubtotal,
    user,
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
    addToCart,
    updateCartQuantity,
    clearCart,
    startEmailOtpLogin,
    verifyEmailOtpLogin,
    startEmailOtpRegister,
    verifyEmailOtpRegister,
    loginWithClerkOAuth,
    handleRegister,
    updateUserAddress,
    updateUserAddresses,
    screen
  } = state;

  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [hierarchyTeams, setHierarchyTeams] = useState(state.teamList);
  const [hierarchyModels, setHierarchyModels] = useState<Product[]>([]);
  const [teamFiltersById, setTeamFiltersById] = useState<Record<string, TeamCatalogFilters>>({});
  const [checkoutContext, setCheckoutContext] = useState<CheckoutContext>(DEFAULT_CHECKOUT_CONTEXT);
  const previousUserRef = useRef(user);
  const lastDeniedAdminRouteRef = useRef<string | null>(null);
  const fetchedModelDetailsRef = useRef<Set<string>>(new Set());
  const selectedTeam =
    hierarchyTeams.find((team) => route.name === "team" && team.id === route.id) ??
    (route.name === "team" ? teamList.find((team) => team.id === route.id) : undefined) ??
    (route.name === "team" ? screen?.team : undefined) ??
    null;
  const selectedRouteProduct =
    route.name === "product"
      ? ((screen?.product as Product | undefined) ?? hierarchyModels.find((item) => item.id === route.id) ?? null)
      : null;
  const activeTeamFilters = selectedTeam ? teamFiltersById[selectedTeam.id] ?? DEFAULT_TEAM_FILTERS : DEFAULT_TEAM_FILTERS;
  const visibleTeamModels = filterCatalogProducts(hierarchyModels, activeTeamFilters);

  const getCategoryColor = (categorySlug: string): string => {
    const colorMap: Record<string, string> = {
      nacionais: "#1e3c72",
      internacionais: "#c41e3a",
      selecoes: "#ffd700",
      personalizado: "#0f766e"
    };
    return colorMap[categorySlug] ?? "#333";
  };

  const mapApiTeamToHierarchyTeam = (team: { slug: string; name: string; logo?: string; categorySlug: string; league?: string }) => {
    const fallbackTeam = teamList.find((item) => item.id === team.slug);
    return {
      id: team.slug,
      name: team.name,
      logo: team.logo ?? fallbackTeam?.logo ?? "",
      category: team.categorySlug,
      league: team.league
    };
  };

  const mergeProductDetailIntoModelList = (prev: Product[], merged: Product) => {
    const index = prev.findIndex((item) => item.id === merged.id);
    if (index === -1) {
      return [...prev, merged];
    }
    const next = [...prev];
    next[index] = merged;
    return next;
  };

  const isLoading = route.name === "category" ? isCategoryLoading : route.name === "team" ? isTeamLoading : false;
  const isAdminAreaRoute = isAdminRoute(route);
  const hasAdminAccess = hasAdminRouteAccess(user, authSession);

  useEffect(() => {
    if (shouldResetCheckoutContextOnUserChange(previousUserRef.current, user)) {
      setCheckoutContext(DEFAULT_CHECKOUT_CONTEXT);
    }

    previousUserRef.current = user;
  }, [user]);

  useEffect(() => {
    if (route.name !== "category") {
      setIsCategoryLoading(false);
      return;
    }

    if (route.slug === "personalizado") {
      const customizableTeamIds = new Set(
        productList
          .filter((product) => product.customizationEnabled && product.customizationTemplatePng)
          .map((product) => product.teamId)
      );

      setHierarchyTeams(
        teamList
          .filter((team) => customizableTeamIds.has(team.id))
          .map((team) => ({ ...team, category: "personalizado" }))
      );
      setHierarchyModels([]);
      setIsCategoryLoading(false);
      return;
    }

    const inactiveTeamIds = new Set(["barcelona"]);
    let active = true;
    setIsCategoryLoading(true);
    setHierarchyTeams([]);
    setHierarchyModels([]);

    fetchPublicTeamsByCategory(route.slug)
      .then((teamsFromApi) => {
        if (!active) {
          return;
        }

        setHierarchyTeams(teamsFromApi.map(mapApiTeamToHierarchyTeam));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setHierarchyTeams(teamList.filter((team) => team.category === route.slug && !inactiveTeamIds.has(team.id)));
      })
      .finally(() => {
        if (active) {
          setIsCategoryLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [route, teamList, productList]);

  useEffect(() => {
    if (!isAdminAreaRoute || hasAdminAccess) {
      lastDeniedAdminRouteRef.current = null;
      return;
    }

    if (lastDeniedAdminRouteRef.current === route.name) {
      return;
    }

    recordSecurityEvent({
      type: "admin-access-denied",
      reason: "missing-admin-role-or-session",
      email: user?.email,
      route: route.name
    });
    lastDeniedAdminRouteRef.current = route.name;
  }, [hasAdminAccess, isAdminAreaRoute, recordSecurityEvent, route.name, user?.email]);

  useEffect(() => {
    if (route.name !== "team") {
      setIsTeamLoading(false);
      return;
    }

    let active = true;
    setIsTeamLoading(true);
    setHierarchyModels([]);

    if (!selectedTeam) {
      setIsTeamLoading(false);
      setHierarchyModels([]);
      return;
    }

    if (selectedTeam.category === "personalizado") {
      setHierarchyModels(
        productList.filter(
          (product) =>
            product.teamId === selectedTeam.id &&
            product.inStock &&
            Boolean(product.customizationEnabled && product.customizationTemplatePng)
        )
      );
      setIsTeamLoading(false);
      return;
    }

    fetchPublicModelsByTeam(selectedTeam.id)
      .then((modelsFromApi) => {
        if (!active) {
          return;
        }

        const localProductsByTeam = productList.filter((product) => product.teamId === selectedTeam.id);

        setHierarchyModels(mergeHierarchyModelsWithLocalProducts(modelsFromApi, selectedTeam, localProductsByTeam));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setHierarchyModels(productList.filter((product) => product.teamId === selectedTeam.id && product.inStock));
      })
      .finally(() => {
        if (active) {
          setIsTeamLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [route, productList, selectedTeam]);

  useEffect(() => {
    if (route.name !== "product") {
      fetchedModelDetailsRef.current.clear();
    }
  }, [route.name]);

  useEffect(() => {
    if (route.name !== "product" || !selectedRouteProduct || selectedRouteProduct.team.category === "personalizado") {
      return;
    }

    const detailCacheKey = `${selectedRouteProduct.team.id}:${selectedRouteProduct.id}`;
    if (fetchedModelDetailsRef.current.has(detailCacheKey)) {
      return;
    }

    fetchedModelDetailsRef.current.add(detailCacheKey);

    let active = true;

    fetchPublicModelDetail(selectedRouteProduct.team.id, selectedRouteProduct.id)
      .then((modelDetail) => {
        if (!active) {
          return;
        }

        const merged = mapHierarchyModelToProduct(
          {
            slug: modelDetail.slug,
            name: modelDetail.name,
            description: modelDetail.description,
            thumbnailUrl: modelDetail.thumbnailUrl,
            images: modelDetail.images,
            price: modelDetail.price,
            originalPrice: modelDetail.originalPrice,
            customizationEnabled: modelDetail.customizationEnabled,
            customizationTemplatePng: modelDetail.customizationTemplatePng,
            customizationTemplateMetadata: modelDetail.customizationTemplateMetadata,
            available: modelDetail.available,
            stockQuantity: modelDetail.stockQuantity,
            variants: modelDetail.variants
          },
          selectedRouteProduct.team,
          [selectedRouteProduct]
        );

        setHierarchyModels((prev) => mergeProductDetailIntoModelList(prev, merged));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        // Permite nova tentativa caso a chamada falhe.
        fetchedModelDetailsRef.current.delete(detailCacheKey);
      });

    return () => {
      active = false;
    };
  }, [route, selectedRouteProduct]);

  useEffect(() => {
    if (route.name !== "login" || !user || !authSession?.token) {
      return;
    }

    const isAdmin = user.role === "admin" && authSession.internalRole === "admin";
    if (isAdmin && route.blockedAdminRoute) {
      setRoute(route.blockedAdminRoute);
      return;
    }

    if (isAdmin) {
      setRoute({ name: "admin" });
      return;
    }

    if (route.redirectAfterLogin === "checkout") {
      setRoute({ name: "checkout" });
      return;
    }

    if (route.redirectAfterLogin === "orders") {
      setRoute({ name: "orders" });
      return;
    }

    if (route.redirectAfterLogin === "profile") {
      setRoute({ name: "profile" });
      return;
    }

    setRoute({ name: "profile" });
  }, [authSession, route, setRoute, user]);

  if (isAdminAreaRoute && !hasAdminAccess) {
    return (
      <>
        <View style={styles.stackScreen}>
          <Pressable onPress={() => setRoute({ name: "home" })}>
            <Text style={styles.backLink}>Voltar</Text>
          </Pressable>
          <Text style={styles.screenTitle}>Acesso restrito</Text>
          <Text style={styles.screenDescription}>Somente administradores autenticados podem acessar esta area.</Text>
          <Text style={styles.errorText}>Acesso negado: permissao insuficiente.</Text>
          <Pressable
            style={styles.primaryActionButton}
            onPress={() => setRoute(buildAdminRecoveryLoginRoute(route))}
          >
            <Text style={styles.primaryActionButtonText}>Entrar como admin</Text>
          </Pressable>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Baluarte</Text>
          <Text style={styles.footerText}>A melhor loja de camisas de times do Brasil.</Text>
          <Text style={styles.footerMeta}>2024 Baluarte Artigos Esportivos. Todos os direitos reservados.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      {route.name === "home" ? (
        <HomeScreen
          isLoading={isLoading}
          featuredProducts={featuredProducts}
          onOpenCategory={(slug) => setRoute({ name: "category", slug })}
          onOpenProduct={(productId) => setRoute({ name: "product", id: productId })}
        />
      ) : null}

      {route.name === "category" && screen ? (
        <View style={styles.stackScreen}>
          <Pressable onPress={() => setRoute({ name: "home" })}>
            <Text style={styles.backLink}>Voltar</Text>
          </Pressable>
          <Text style={styles.screenTitle}>{screen.title ?? "Categoria"}</Text>
          <Text style={styles.screenDescription}>{screen.description ?? ""}</Text>

          <View style={styles.teamGrid}>
            {isLoading ? (
              // Show skeleton loaders during loading
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} variant="team" />
              ))
            ) : (
              // Show actual teams when loaded
              hierarchyTeams.map((team) => (
                <Pressable 
                  key={team.id} 
                  style={[
                    styles.teamCard, 
                    { 
                      borderTopColor: getCategoryColor(route.name === "category" ? route.slug : "nacionais"),
                      borderTopWidth: 4
                    }
                  ]} 
                  onPress={() => setRoute({ name: "team", id: team.id })}
                >
                  <Image source={{ uri: team.logo }} style={styles.teamLogo as ImageStyle} />
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamLeague}>{team.league ?? "Selecao"}</Text>
                </Pressable>
              ))
            )}
          </View>
          {!isLoading && hierarchyTeams.length === 0 ? (
            <Text style={styles.screenDescription}>Nenhum time ativo disponivel para esta categoria no momento.</Text>
          ) : null}
        </View>
      ) : null}

      {route.name === "team" ? (
        <TeamScreen
          isLoading={isLoading}
          team={selectedTeam}
          products={visibleTeamModels}
          searchQuery={activeTeamFilters.searchQuery}
          selectedSize={activeTeamFilters.selectedSize}
          inStockOnly={activeTeamFilters.inStockOnly}
          onSaleOnly={activeTeamFilters.onSaleOnly}
          onChangeSearchQuery={(value) => {
            if (!selectedTeam) {
              return;
            }
            setTeamFiltersById((prev) => ({
              ...prev,
              [selectedTeam.id]: {
                ...(prev[selectedTeam.id] ?? DEFAULT_TEAM_FILTERS),
                searchQuery: value
              }
            }));
          }}
          onToggleSize={(size) => {
            if (!selectedTeam) {
              return;
            }
            setTeamFiltersById((prev) => {
              const current = prev[selectedTeam.id] ?? DEFAULT_TEAM_FILTERS;
              return {
                ...prev,
                [selectedTeam.id]: {
                  ...current,
                  selectedSize: current.selectedSize === size ? null : size
                }
              };
            });
          }}
          onToggleInStockOnly={() => {
            if (!selectedTeam) {
              return;
            }
            setTeamFiltersById((prev) => {
              const current = prev[selectedTeam.id] ?? DEFAULT_TEAM_FILTERS;
              return {
                ...prev,
                [selectedTeam.id]: {
                  ...current,
                  inStockOnly: !current.inStockOnly
                }
              };
            });
          }}
          onToggleOnSaleOnly={() => {
            if (!selectedTeam) {
              return;
            }
            setTeamFiltersById((prev) => {
              const current = prev[selectedTeam.id] ?? DEFAULT_TEAM_FILTERS;
              return {
                ...prev,
                [selectedTeam.id]: {
                  ...current,
                  onSaleOnly: !current.onSaleOnly
                }
              };
            });
          }}
          onClearFilters={() => {
            if (!selectedTeam) {
              return;
            }
            setTeamFiltersById((prev) => ({
              ...prev,
              [selectedTeam.id]: DEFAULT_TEAM_FILTERS
            }));
          }}
          onBack={() =>
            setRoute({
              name: "category",
              slug:
                (hierarchyTeams.find((team) => team.id === route.id)?.category as Category) ??
                (screen?.team?.category as Category) ??
                "nacionais"
            })
          }
          onSelectProduct={(id) => setRoute({ name: "product", id })}
        />
      ) : null}

      {route.name === "product" ? (
        <ProductScreen
          product={selectedRouteProduct}
          onBackToTeam={(teamId) => setRoute({ name: "team", id: teamId })}
          onBackHome={() => setRoute({ name: "home" })}
          onAddToCart={addToCart}
          onGoCart={() => setRoute({ name: "cart" })}
        />
      ) : null}

      {route.name === "cart" ? (
        <CartScreen
          items={cartItems}
          subtotal={baseSubtotal}
          customizationNameCount={customizationNameCount}
          customizationSubtotal={customizationSubtotal}
          customizationNumberDigitCount={customizationNumberDigitCount}
          customizationNumberSubtotal={customizationNumberSubtotal}
          shipping={shipping}
          discount={discount}
          total={total}
          appliedCoupon={appliedCoupon}
          onRequestShippingQuotes={async (destination, itemsCount) => {
            try {
              const options = await requestShippingQuotes(destination, itemsCount);
              return { ok: true as const, options };
            } catch {
              return {
                ok: false as const,
                error: "Nao foi possivel cotar o frete para este CEP. Revise os dados e tente novamente."
              };
            }
          }}
          onApplyCoupon={(code) => {
            const coupon = coupons.find((item) => item.code.toLowerCase() === code.toLowerCase() && item.active);
            if (!coupon) {
              return { ok: false as const, error: "Cupom invalido ou expirado" };
            }
            if (coupon.minValue && subtotal < coupon.minValue) {
              return {
                ok: false as const,
                error: `Valor minimo de R$ ${coupon.minValue.toFixed(2).replace(".", ",")} para usar este cupom`
              };
            }
            setAppliedCoupon(coupon);
            return { ok: true as const };
          }}
          onRemoveCoupon={() => setAppliedCoupon(null)}
          onSetShipping={setShipping}
          onUpdateQuantity={updateCartQuantity}
          onClearCart={clearCart}
          onBackHome={() => setRoute({ name: "home" })}
          onCheckout={() => setRoute({ name: "checkout" })}
        />
      ) : null}

      {route.name === "checkout" ? (
        <CheckoutScreen
          user={user}
          items={cartItems}
          subtotal={subtotal}
          shipping={shipping}
          discount={discount}
          total={total}
          initialStep={checkoutContext.step}
          initialSelectedAddressId={checkoutContext.selectedAddressId}
          guestAddressDraft={checkoutContext.guestAddressDraft}
          onCheckoutContextChange={setCheckoutContext}
          onSetShipping={setShipping}
          onRequestShippingQuotes={async (destination, itemsCount) => {
            try {
              const options = await requestShippingQuotes(destination, itemsCount);
              return { ok: true as const, options };
            } catch {
              return {
                ok: false as const,
                error: "Nao foi possivel cotar o frete para este destino. Revise os dados e tente novamente."
              };
            }
          }}
          onBackCart={() => setRoute({ name: "cart" })}
          onGoProfile={() => setRoute({ name: "profile" })}
          onRequireAuth={() => setRoute({ name: "login", redirectAfterLogin: "checkout" })}
          onFinalizeOrder={async () => {
            const authorization = await ensureCheckoutFinalizationAuthorized(user, authSession);

            if (!authorization.ok) {
              return { ok: false as const, requiresAuth: true as const };
            }

            return { ok: true as const };
          }}
          onOrderComplete={(shippingAddressFromCheckout) => {
            const shippingAddress = shippingAddressFromCheckout ?? resolveCheckoutShippingAddress(user, checkoutContext);
            if (!shippingAddress) {
              setRoute({ name: "profile" });
              return;
            }
            const newOrder: Order = {
              id: `ORD-${Date.now().toString().slice(-6)}`,
              userId: user?.id ?? "guest",
              items: cartItems,
              total,
              status: "aguardando_pagamento",
              createdAt: new Date(),
              shippingAddress
            };
            setOrders((prev) => [newOrder, ...prev]);
            clearCart();
            setCheckoutContext(DEFAULT_CHECKOUT_CONTEXT);
            setRoute({ name: "home" });
          }}
        />
      ) : null}

      {route.name === "login" ? (
        <LoginScreen
          initialMode={route.authMode ?? "login"}
          onBack={() => {
            if (route.blockedAdminRoute) {
              setRoute(route.blockedAdminRoute);
              return;
            }

            setRoute(route.redirectAfterLogin === "checkout" ? { name: "checkout" } : { name: "home" });
          }}
          onStartEmailLogin={async (email: string) => {
            return startEmailOtpLogin(email);
          }}
          onVerifyEmailOtp={async (code: string) => {
            const result = await verifyEmailOtpLogin(code);
            if (!result.ok) {
              return { ok: false, error: result.error ?? "Codigo OTP invalido." };
            }

            redirectAfterLogin(route, setRoute, result.internalRole);
            return { ok: true };
          }}
          onStartEmailRegister={async (firstName: string, lastName: string, email: string) => {
            return startEmailOtpRegister(firstName, lastName, email);
          }}
          onVerifyRegisterOtp={async (code: string) => {
            const result = await verifyEmailOtpRegister(code);
            if (!result.ok) {
              return { ok: false, error: result.error ?? "Codigo OTP invalido." };
            }

            redirectAfterLogin(route, setRoute, result.internalRole);
            return { ok: true };
          }}
          onLoginWithSocial={async (provider: "google" | "apple") => {
            const result = await loginWithClerkOAuth(provider);
            if (!result.ok) {
              return { ok: false, error: result.error ?? "Falha ao iniciar login social." };
            }

            return { ok: true };
          }}
          onRegister={async (firstName: string, lastName: string, email: string) => {
            const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
            const generatedPassword = `Baluarte#${Date.now()}`;
            const result = await handleRegister(fullName, email, generatedPassword);
            if (!result.ok) {
              return result;
            }

            redirectAfterLogin(route, setRoute);
            return { ok: true as const };
          }}
        />
      ) : null}

      {route.name === "orders" ? (
        <OrdersScreen
          user={user}
          orders={orders}
          onBack={() => setRoute({ name: "home" })}
          onLogin={() => setRoute({ name: "login", redirectAfterLogin: "orders", authMode: "login" })}
        />
      ) : null}

      {route.name === "profile" ? (
        <ProfileScreen
          user={user}
          ordersCount={orders.filter((item) => item.userId === (user?.id ?? "")).length}
          onBack={() => setRoute({ name: "home" })}
          onLogin={() => setRoute({ name: "login", redirectAfterLogin: "profile", authMode: "login" })}
          onOpenOrders={() => setRoute({ name: "orders" })}
          onUpdateAddress={updateUserAddress}
          onUpdateAddresses={updateUserAddresses}
        />
      ) : null}

      {route.name === "admin" ? (
        <AdminScreen
          user={user}
          orders={orders}
          productsCount={productList.length}
          onBack={() => setRoute({ name: "home" })}
          onLogin={() => setRoute({ name: "login", redirectAfterLogin: "orders", authMode: "login" })}
          onOpenDashboard={() => setRoute({ name: "admin-dashboard" })}
          onOpenCategories={() => setRoute({ name: "admin-categories" })}
          onOpenTeams={() => setRoute({ name: "admin-teams" })}
          onOpenProducts={() => setRoute({ name: "admin-products" })}
          onOpenOrders={() => setRoute({ name: "admin-orders" })}
          onOpenCoupons={() => setRoute({ name: "admin-coupons" })}
        />
      ) : null}

      {route.name === "admin-dashboard" ? (
        <AdminDashboardScreen
          onBack={() => setRoute({ name: "admin" })}
          onOpenOrders={() => setRoute({ name: "admin-orders" })}
          onOpenProducts={() => setRoute({ name: "admin-products" })}
          products={productList}
        />
      ) : null}

      {route.name === "admin-categories" ? (
        <AdminCategoriesScreen
          user={user}
          categories={categories}
          teams={teamList}
          onBack={() => setRoute({ name: "admin" })}
          onUpdateCategories={setCategories}
        />
      ) : null}

      {route.name === "admin-teams" ? (
        <AdminTeamsScreen
          user={user}
          categories={categories}
          teams={teamList}
          products={productList}
          onBack={() => setRoute({ name: "admin" })}
          onUpdateTeams={routeToAdminTeamUpdateFn(setTeamList, setProductList)}
        />
      ) : null}

      {route.name === "admin-products" ? (
        <AdminProductsScreen
          user={user}
          authSession={authSession}
          categories={categories}
          teams={teamList}
          products={productList}
          onBack={() => setRoute({ name: "admin" })}
          onUpdateProducts={setProductList}
        />
      ) : null}

      {route.name === "admin-orders" ? (
        <AdminOrdersScreen
          user={user}
          orders={orders}
          onBack={() => setRoute({ name: "admin" })}
          onUpdateOrders={setOrders}
        />
      ) : null}

      {route.name === "admin-coupons" ? (
        <AdminCouponsScreen
          user={user}
          coupons={coupons}
          onBack={() => setRoute({ name: "admin" })}
          onUpdateCoupons={setCoupons}
        />
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerBrand}>Baluarte</Text>
        <Text style={styles.footerText}>A melhor loja de camisas de times do Brasil.</Text>
        <Text style={styles.footerMeta}>2024 Baluarte Artigos Esportivos. Todos os direitos reservados.</Text>
      </View>
    </>
  );
}
