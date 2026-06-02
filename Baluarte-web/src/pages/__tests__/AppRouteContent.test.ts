import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import {
  AppRouteContent,
  buildAdminRecoveryLoginRoute,
  ensureCheckoutFinalizationAuthorized,
  hasAdminRouteAccess,
  filterCatalogProducts,
  mapHierarchyModelToProduct,
  mergeHierarchyModelsWithLocalProducts,
  resolveCheckoutShippingAddress,
  shouldResetCheckoutContextOnUserChange,
  isAdminRoute
} from "../AppRouteContent";
import * as clerkClient from "../../lib/clerkClient";
import type { AppState } from "../../hooks/useAppState";
import type { Product, Size } from "../../lib/types";

const PRODUCT_SIZES: Size[] = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"];

const stockBySize = (overrides: Partial<Record<Size, number>> = {}): Record<Size, number> => ({
  P: 0,
  M: 0,
  G: 0,
  GG: 0,
  G1: 0,
  G2: 0,
  G3: 0,
  G4: 0,
  ...overrides
});

function buildProduct(teamId: string, id: string): Product {
  return {
    id,
    name: `Produto ${id}`,
    description: "descricao",
    price: 100,
    image: "https://example.com/image.png",
    teamId,
    team: {
      id: teamId,
      name: teamId,
      logo: "https://example.com/logo.png",
      category: "nacionais",
      league: "Serie A"
    },
    sizes: PRODUCT_SIZES,
    stockBySize: stockBySize({ P: 1, M: 2, G: 3, GG: 4 }),
    inStock: true
  };
}

function buildAppState(overrides: Partial<AppState>): AppState {
  return {
    route: { name: "home" },
    setRoute: jest.fn(),
    categories: [],
    setCategories: jest.fn(),
    teamList: [],
    setTeamList: jest.fn(),
    productList: [],
    setProductList: jest.fn(),
    coupons: [],
    setCoupons: jest.fn(),
    cartItems: [],
    shipping: 0,
    setShipping: jest.fn(),
    appliedCoupon: null,
    setAppliedCoupon: jest.fn(),
    baseSubtotal: 0,
    user: null,
    setUser: jest.fn(),
    authSession: null,
    setAuthSession: jest.fn(),
    securityAuditEvents: [],
    recordSecurityEvent: jest.fn(),
    orders: [],
    setOrders: jest.fn(),
    featuredProducts: [],
    subtotal: 0,
    customizationNameCount: 0,
    customizationSubtotal: 0,
    customizationNumberDigitCount: 0,
    customizationNumberSubtotal: 0,
    discount: 0,
    total: 0,
    cartCount: 0,
    addToCart: jest.fn(),
    updateCartQuantity: jest.fn(),
    clearCart: jest.fn(),
    handleLogin: jest.fn(),
    startEmailOtpLogin: jest.fn(),
    verifyEmailOtpLogin: jest.fn(),
    startEmailOtpRegister: jest.fn(),
    verifyEmailOtpRegister: jest.fn(),
    loginWithClerkOAuth: jest.fn(),
    handleRegister: jest.fn(),
    updateUserAddress: jest.fn(),
    updateUserAddresses: jest.fn(),
    screen: null,
    inAdminArea: false,
    accountLabel: "Perfil",
    ...overrides
  } as AppState;
}

describe("mapHierarchyModelToProduct", () => {
  it("does not bind product from another team when slug collides", () => {
    const selectedTeam = {
      id: "team-a",
      name: "Team A",
      logo: "https://example.com/a.png",
      category: "nacionais",
      league: "Serie A"
    };

    const otherTeamProduct = buildProduct("team-b", "shared-slug");

    const mapped = mapHierarchyModelToProduct(
      { slug: "shared-slug", name: "Modelo API" },
      selectedTeam,
      [otherTeamProduct].filter((product) => product.teamId === selectedTeam.id)
    );

    expect(mapped.teamId).toBe("team-a");
    expect(mapped.inStock).toBe(false);
    expect(mapped.stockBySize).toEqual(stockBySize());
  });

  it("maps stock by size from api variants", () => {
    const selectedTeam = {
      id: "team-a",
      name: "Team A",
      logo: "https://example.com/a.png",
      category: "nacionais",
      league: "Serie A"
    };

    const mapped = mapHierarchyModelToProduct(
      {
        slug: "modelo-1",
        name: "Modelo API",
        price: 149,
        originalPrice: 299.9,
        thumbnailUrl: "https://example.com/modelo.png",
        variants: [
          { size: "P", stockQuantity: 10, available: true },
          { size: "M", stockQuantity: 10, available: true },
          { size: "G", stockQuantity: 10, available: true },
          { size: "GG", stockQuantity: 10, available: true }
        ]
      },
      selectedTeam,
      []
    );

    expect(mapped.price).toBe(149);
    expect(mapped.originalPrice).toBe(299.9);
    expect(mapped.image).toBe("https://example.com/modelo.png");
    expect(mapped.stockBySize).toEqual(stockBySize({ P: 10, M: 10, G: 10, GG: 10 }));
    expect(mapped.inStock).toBe(true);
  });
});

describe("mergeHierarchyModelsWithLocalProducts", () => {
  it("keeps api models and appends local team products missing from the public catalog", () => {
    const selectedTeam = {
      id: "team-a",
      name: "Team A",
      logo: "https://example.com/a.png",
      category: "nacionais",
      league: "Serie A"
    };

    const localOnlyProduct = buildProduct("team-a", "local-only-1");

    const result = mergeHierarchyModelsWithLocalProducts(
      [{ slug: "public-model-1", name: "Modelo API" }],
      selectedTeam,
      [localOnlyProduct]
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("public-model-1");
    expect(result[1].id).toBe("local-only-1");
    expect(result[1].teamId).toBe("team-a");
  });
});

describe("admin route authorization", () => {
  it("identifies admin routes and aligns access with admin sessions", () => {
    expect(isAdminRoute({ name: "admin-products" })).toBe(true);
    expect(isAdminRoute({ name: "home" })).toBe(false);
    expect(
      hasAdminRouteAccess(
        { id: "u1", name: "Admin", email: "admin@loja.com", role: "admin" },
        { token: "sess-admin-1", internalRole: "admin", provider: "demo", issuedAt: new Date().toISOString() }
      )
    ).toBe(true);
    expect(
      hasAdminRouteAccess(
        { id: "u1", name: "Admin", email: "admin@loja.com", role: "admin" },
        { token: "sess-client-1", internalRole: "client", provider: "demo", issuedAt: new Date().toISOString() }
      )
    ).toBe(false);
  });

  it("builds a login recovery route that preserves the blocked admin destination", () => {
    expect(buildAdminRecoveryLoginRoute({ name: "admin-orders" })).toEqual({
      name: "login",
      authMode: "login",
      blockedAdminRoute: { name: "admin-orders" },
      redirectAfterLogin: undefined
    });
  });
});

describe("AppRouteContent blocked admin flow", () => {
  it("records denied access and preserves the blocked admin route when recovery is requested", () => {
    const setRoute = jest.fn();
    const recordSecurityEvent = jest.fn();

    render(
      createElement(AppRouteContent, {
        state: buildAppState({
          route: { name: "admin-products" },
          setRoute,
          user: {
            id: "u1",
            name: "Joao",
            email: "joao@email.com",
            role: "client"
          },
          authSession: null,
          recordSecurityEvent
        })
      })
    );

    expect(screen.getByText("Acesso restrito")).toBeTruthy();
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "admin-access-denied",
        route: "admin-products"
      })
    );

    fireEvent.press(screen.getByText("Entrar como admin"));

    expect(setRoute).toHaveBeenLastCalledWith({
      name: "login",
      authMode: "login",
      blockedAdminRoute: { name: "admin-products" },
      redirectAfterLogin: undefined
    });
  });

  it("returns to the blocked admin route after admin login succeeds", async () => {
    const setRoute = jest.fn();
    const startEmailOtpLogin = jest.fn().mockResolvedValue({ ok: true });
    const verifyEmailOtpLogin = jest.fn().mockResolvedValue({ ok: true, internalRole: "admin" });

    render(
      createElement(AppRouteContent, {
        state: buildAppState({
          route: { name: "login", authMode: "login", blockedAdminRoute: { name: "admin-orders" } },
          setRoute,
          startEmailOtpLogin,
          verifyEmailOtpLogin
        })
      })
    );

    fireEvent.changeText(screen.getByPlaceholderText("Email"), "admin@baluarte.com");
    fireEvent.press(screen.getByText("Enviar codigo"));
    fireEvent.changeText(await screen.findByPlaceholderText("Codigo de verificacao"), "123456");
    fireEvent.press(screen.getByText("Validar codigo"));

    await waitFor(() => {
      expect(setRoute).toHaveBeenLastCalledWith({ name: "admin-orders" });
    });

    expect(startEmailOtpLogin).toHaveBeenCalledWith("admin@baluarte.com");
    expect(verifyEmailOtpLogin).toHaveBeenCalledWith("123456");
  });
});

describe("filterCatalogProducts", () => {
  const products: Product[] = [
    {
      ...buildProduct("flamengo", "fla-1"),
      name: "Camisa Flamengo I",
      originalPrice: 349.9,
      stockBySize: stockBySize({ M: 2 })
    },
    {
      ...buildProduct("flamengo", "fla-2"),
      name: "Camisa Treino",
      stockBySize: stockBySize(),
      inStock: false
    }
  ];

  it("filters by search text, sale and selected size", () => {
    const result = filterCatalogProducts(products, {
      searchQuery: "flamengo",
      selectedSize: "M",
      inStockOnly: false,
      onSaleOnly: true
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fla-1");
  });

  it("filters unavailable products when inStockOnly is active", () => {
    const result = filterCatalogProducts(products, {
      searchQuery: "",
      selectedSize: null,
      inStockOnly: true,
      onSaleOnly: false
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fla-1");
  });
});

describe("resolveCheckoutShippingAddress", () => {
  it("uses preserved guest address when no selected user address is provided", () => {
    const shippingAddress = resolveCheckoutShippingAddress(
      {
        id: "u1",
        name: "Joao",
        email: "joao@email.com",
        role: "client",
        defaultAddressId: "addr-default",
        addresses: [
          {
            id: "addr-default",
            cep: "22222-000",
            street: "Rua B",
            number: "200",
            neighborhood: "Jardins",
            city: "Sao Paulo",
            state: "SP"
          }
        ]
      },
      {
        selectedAddressId: undefined,
        guestAddressDraft: {
          cep: "01001-000",
          street: "Rua A",
          number: "100",
          neighborhood: "Centro",
          city: "Sao Paulo",
          state: "SP"
        }
      }
    );

    expect(shippingAddress).toEqual(
      expect.objectContaining({
        street: "Rua A",
        number: "100"
      })
    );
  });

  it("prioritizes explicitly selected user address over guest draft", () => {
    const shippingAddress = resolveCheckoutShippingAddress(
      {
        id: "u1",
        name: "Joao",
        email: "joao@email.com",
        role: "client",
        addresses: [
          {
            id: "addr-selected",
            cep: "33333-000",
            street: "Rua C",
            number: "300",
            neighborhood: "Vila",
            city: "Sao Paulo",
            state: "SP"
          }
        ]
      },
      {
        selectedAddressId: "addr-selected",
        guestAddressDraft: {
          cep: "01001-000",
          street: "Rua A",
          number: "100",
          neighborhood: "Centro",
          city: "Sao Paulo",
          state: "SP"
        }
      }
    );

    expect(shippingAddress).toEqual(
      expect.objectContaining({
        street: "Rua C",
        number: "300"
      })
    );
  });
});

describe("shouldResetCheckoutContextOnUserChange", () => {
  it("resets checkout context after logout", () => {
    const shouldReset = shouldResetCheckoutContextOnUserChange(
      {
        id: "u1",
        name: "Joao",
        email: "joao@email.com",
        role: "client"
      },
      null
    );

    expect(shouldReset).toBe(true);
  });

  it("does not reset guest checkout context while unauthenticated", () => {
    const shouldReset = shouldResetCheckoutContextOnUserChange(null, null);

    expect(shouldReset).toBe(false);
  });
});

describe("ensureCheckoutFinalizationAuthorized", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("requires authentication when user session is missing", async () => {
    await expect(ensureCheckoutFinalizationAuthorized(null, null)).resolves.toEqual({
      ok: false,
      requiresAuth: true
    });
  });

  it("authorizes demo sessions without backend roundtrip", async () => {
    const resolveSpy = jest.spyOn(clerkClient, "resolveBackendSessionRole");

    await expect(
      ensureCheckoutFinalizationAuthorized(
        { id: "u1", name: "Joao", email: "joao@email.com", role: "client" },
        { token: "sess-demo-1", internalRole: "client", provider: "demo", issuedAt: new Date().toISOString() }
      )
    ).resolves.toEqual({ ok: true });

    expect(resolveSpy).not.toHaveBeenCalled();
  });

  it("requires authentication when Clerk identity is unavailable", async () => {
    jest.spyOn(clerkClient, "getActiveClerkIdentity").mockResolvedValue(null);

    await expect(
      ensureCheckoutFinalizationAuthorized(
        { id: "u1", name: "Joao", email: "joao@email.com", role: "client" },
        { token: "sess-clerk-1", internalRole: "client", provider: "clerk", issuedAt: new Date().toISOString() }
      )
    ).resolves.toEqual({
      ok: false,
      requiresAuth: true
    });
  });

  it("authorizes Clerk sessions after backend validation succeeds", async () => {
    jest.spyOn(clerkClient, "getActiveClerkIdentity").mockResolvedValue({
      userId: "user_321",
      email: "joao@email.com",
      sessionToken: "token_clerk_1"
    });
    jest.spyOn(clerkClient, "resolveBackendSessionRole").mockResolvedValue({
      ok: true,
      role: "client",
      session: {
        userId: "user_321",
        email: "joao@email.com",
        internalRole: "client"
      }
    });

    await expect(
      ensureCheckoutFinalizationAuthorized(
        { id: "u1", name: "Joao", email: "joao@email.com", role: "client" },
        { token: "sess-clerk-1", internalRole: "client", provider: "clerk", issuedAt: new Date().toISOString() }
      )
    ).resolves.toEqual({ ok: true });
  });

  it("requires authentication when Clerk identity lookup throws", async () => {
    jest.spyOn(clerkClient, "getActiveClerkIdentity").mockRejectedValue(new Error("lookup-failed"));

    await expect(
      ensureCheckoutFinalizationAuthorized(
        { id: "u1", name: "Joao", email: "joao@email.com", role: "client" },
        { token: "sess-clerk-1", internalRole: "client", provider: "clerk", issuedAt: new Date().toISOString() }
      )
    ).resolves.toEqual({
      ok: false,
      requiresAuth: true
    });
  });

  it("requires authentication when backend session resolution throws", async () => {
    jest.spyOn(clerkClient, "getActiveClerkIdentity").mockResolvedValue({
      userId: "user_321",
      email: "joao@email.com",
      sessionToken: "token_clerk_1"
    });
    jest.spyOn(clerkClient, "resolveBackendSessionRole").mockRejectedValue(new Error("backend-down"));

    await expect(
      ensureCheckoutFinalizationAuthorized(
        { id: "u1", name: "Joao", email: "joao@email.com", role: "client" },
        { token: "sess-clerk-1", internalRole: "client", provider: "clerk", issuedAt: new Date().toISOString() }
      )
    ).resolves.toEqual({
      ok: false,
      requiresAuth: true
    });
  });
});
