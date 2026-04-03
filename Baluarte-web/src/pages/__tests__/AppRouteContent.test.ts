import {
  filterCatalogProducts,
  mapHierarchyModelToProduct,
  resolveCheckoutShippingAddress,
  shouldResetCheckoutContextOnUserChange
} from "../AppRouteContent";
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
