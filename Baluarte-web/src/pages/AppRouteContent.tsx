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
import type { AppState } from "../hooks/useAppState";
import type { Address, Category, Order, Product, Size } from "../lib/types";
import { fetchPublicModelsByTeam, fetchPublicTeamsByCategory } from "../lib/mobile/api/catalog";
import styles from "../App.styles";

type AppRouteContentProps = {
  state: AppState;
};

type HierarchyModelShape = {
  slug: string;
  name: string;
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

  if (localMatch) {
    return {
      ...localMatch,
      id: model.slug,
      name: model.name,
      team: selectedTeam,
      teamId: selectedTeam.id
    };
  }

  return {
    id: model.slug,
    name: model.name,
    description: "Modelo oficial disponivel no catalogo.",
    price: 0,
    image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&q=80",
    teamId: selectedTeam.id,
    team: selectedTeam,
    sizes: ["P", "M", "G", "GG"],
    stockBySize: { P: 0, M: 0, G: 0, GG: 0 },
    inStock: false
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
    user,
    orders,
    setOrders,
    featuredProducts,
    subtotal,
    discount,
    total,
    addToCart,
    updateCartQuantity,
    clearCart,
    handleLogin,
    handleRegister,
    updateUserAddress,
    screen
  } = state;

  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [hierarchyTeams, setHierarchyTeams] = useState(state.teamList);
  const [hierarchyModels, setHierarchyModels] = useState<Product[]>([]);
  const [teamFiltersById, setTeamFiltersById] = useState<Record<string, TeamCatalogFilters>>({});
  const [checkoutContext, setCheckoutContext] = useState<CheckoutContext>(DEFAULT_CHECKOUT_CONTEXT);
  const previousUserRef = useRef(user);
  const selectedTeam =
    hierarchyTeams.find((team) => route.name === "team" && team.id === route.id) ??
    (route.name === "team" ? teamList.find((team) => team.id === route.id) : undefined) ??
    (route.name === "team" ? screen?.team : undefined) ??
    null;
  const activeTeamFilters = selectedTeam ? teamFiltersById[selectedTeam.id] ?? DEFAULT_TEAM_FILTERS : DEFAULT_TEAM_FILTERS;
  const visibleTeamModels = filterCatalogProducts(hierarchyModels, activeTeamFilters);

  const getCategoryColor = (categorySlug: string): string => {
    const colorMap: Record<string, string> = {
      nacionais: "#1e3c72",
      internacionais: "#c41e3a",
      selecoes: "#ffd700"
    };
    return colorMap[categorySlug] ?? "#333";
  };

  const isLoading = route.name === "category" ? isCategoryLoading : route.name === "team" ? isTeamLoading : false;

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

        setHierarchyTeams(
          teamsFromApi.map((team) => {
            const fallbackTeam = teamList.find((item) => item.id === team.slug);

            return {
              id: team.slug,
              name: team.name,
              logo: team.logo ?? fallbackTeam?.logo ?? "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=300&q=80",
              category: team.categorySlug,
              league: team.league
            };
          })
        );
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
  }, [route, teamList]);

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

    fetchPublicModelsByTeam(selectedTeam.id)
      .then((modelsFromApi) => {
        if (!active) {
          return;
        }

        const localProductsByTeam = productList.filter((product) => product.teamId === selectedTeam.id);

        setHierarchyModels(modelsFromApi.map((model) => mapHierarchyModelToProduct(model, selectedTeam, localProductsByTeam)));
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
          product={(screen?.product as Product | undefined) ?? hierarchyModels.find((item) => item.id === route.id) ?? null}
          onBackToTeam={(teamId) => setRoute({ name: "team", id: teamId })}
          onBackHome={() => setRoute({ name: "home" })}
          onAddToCart={addToCart}
          onGoCart={() => setRoute({ name: "cart" })}
        />
      ) : null}

      {route.name === "cart" ? (
        <CartScreen
          items={cartItems}
          subtotal={subtotal}
          shipping={shipping}
          discount={discount}
          total={total}
          appliedCoupon={appliedCoupon}
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
          onBackCart={() => setRoute({ name: "cart" })}
          onGoProfile={() => setRoute({ name: "profile" })}
          onRequireAuth={() => setRoute({ name: "login", redirectAfterLogin: "checkout" })}
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
          onBack={() => setRoute(route.redirectAfterLogin === "checkout" ? { name: "checkout" } : { name: "home" })}
          onLogin={async (email, password) => {
            const ok = await handleLogin(email, password);
            if (!ok) {
              return false;
            }
            const isAdmin = email.trim().toLowerCase() === "admin@loja.com";
            if (isAdmin) {
              setRoute({ name: "admin" });
            } else if (route.redirectAfterLogin === "checkout") {
              setRoute({ name: "checkout" });
            } else if (route.redirectAfterLogin === "profile") {
              setRoute({ name: "profile" });
            } else if (route.redirectAfterLogin === "orders") {
              setRoute({ name: "orders" });
            } else {
              setRoute({ name: "profile" });
            }
            return true;
          }}
          onRegister={async (name, email, password) => {
            const result = await handleRegister(name, email, password);
            if (!result.ok) {
              return result;
            }

            if (route.redirectAfterLogin === "checkout") {
              setRoute({ name: "checkout" });
            } else if (route.redirectAfterLogin === "profile") {
              setRoute({ name: "profile" });
            } else if (route.redirectAfterLogin === "orders") {
              setRoute({ name: "orders" });
            } else {
              setRoute({ name: "profile" });
            }

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
          onUpdateTeams={(nextTeams) => {
            setTeamList(nextTeams);
            setProductList((prev) =>
              prev.map((product) => {
                const nextTeam = nextTeams.find((team) => team.id === product.teamId);
                if (!nextTeam) {
                  return product;
                }
                return {
                  ...product,
                  teamId: nextTeam.id,
                  team: nextTeam
                };
              })
            );
          }}
        />
      ) : null}

      {route.name === "admin-products" ? (
        <AdminProductsScreen
          user={user}
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
