import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import {
  AppRouteContent,
  buildAdminRecoveryLoginRoute,
  hasAdminRouteAccess,
  filterCatalogProducts,
  mapHierarchyModelToProduct,
  resolveCheckoutShippingAddress,
  shouldResetCheckoutContextOnUserChange,
  isAdminRoute
} from "../AppRouteContent";
import type { AppState } from "../../hooks/useAppState";
import type { Product } from "../../lib/types";

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
    sizes: ["P", "M", "G", "GG"],
    stockBySize: { P: 1, M: 2, G: 3, GG: 4 },
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
    handleRegister: jest.fn(),
    updateUserAddress: jest.fn(),
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
    expect(mapped.stockBySize).toEqual({ P: 0, M: 0, G: 0, GG: 0 });
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

    render(
      createElement(AppRouteContent, {
        state: buildAppState({
          route: { name: "login", authMode: "login", blockedAdminRoute: { name: "admin-orders" } },
          setRoute,
          handleLogin: jest.fn().mockResolvedValue({ ok: true, internalRole: "admin" })
        })
      })
    );

    fireEvent.press(screen.getByText("Demo admin"));
    const enterButtons = screen.getAllByText("Entrar");
    fireEvent.press(enterButtons[enterButtons.length - 1]);

    await waitFor(() => {
      expect(setRoute).toHaveBeenLastCalledWith({ name: "admin-orders" });
    });
  });
});

describe("filterCatalogProducts", () => {
  const products: Product[] = [
    {
      ...buildProduct("flamengo", "fla-1"),
      name: "Camisa Flamengo I",
      originalPrice: 349.9,
      stockBySize: { P: 0, M: 2, G: 0, GG: 0 }
    },
    {
      ...buildProduct("flamengo", "fla-2"),
      name: "Camisa Treino",
      stockBySize: { P: 0, M: 0, G: 0, GG: 0 },
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
