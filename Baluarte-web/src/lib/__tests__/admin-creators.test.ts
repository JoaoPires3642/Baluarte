import { createAdminProduct } from "../admin-creators";
import type { Size, Team } from "../types";

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

const team: Team = {
  id: "flamengo",
  name: "Flamengo",
  logo: "https://example.com/flamengo.png",
  category: "nacionais",
  league: "Serie A"
};

describe("createAdminProduct", () => {
  it("persists customization metadata when enabled", () => {
    const product = createAdminProduct(
      "Camisa Flamengo I",
      "Oficial",
      299.9,
      ["https://example.com/product.jpg"],
      team,
      stockBySize({ P: 1, M: 2, G: 3, GG: 4 }),
      undefined,
      true,
      "https://example.com/templates/flamengo-home.png"
    );

    expect(product.customizationEnabled).toBe(true);
    expect(product.customizationTemplatePng).toBe("https://example.com/templates/flamengo-home.png");
  });

  it("stores stock by size and derived availability for public exposure", () => {
    const product = createAdminProduct(
      "Camisa Flamengo I",
      "Oficial",
      299.9,
      ["https://example.com/product.jpg"],
      team,
      stockBySize({ M: 2, G: 3 })
    );

    expect(product.stockBySize).toEqual(stockBySize({ M: 2, G: 3 }));
    expect(product.stockQuantity).toBe(5);
    expect(product.inStock).toBe(true);
  });

  it("marks the product unavailable when all variants are out of stock", () => {
    const product = createAdminProduct(
      "Camisa Flamengo III",
      "Oficial",
      299.9,
      ["https://example.com/product.jpg"],
      team,
      stockBySize()
    );

    expect(product.stockQuantity).toBe(0);
    expect(product.inStock).toBe(false);
  });

  it("defaults customization metadata to disabled and empty template", () => {
    const product = createAdminProduct(
      "Camisa Flamengo I",
      "Oficial",
      299.9,
      ["https://example.com/product.jpg"],
      team,
      stockBySize({ P: 1, M: 2, G: 3, GG: 4 })
    );

    expect(product.customizationEnabled).toBe(false);
    expect(product.customizationTemplatePng).toBeUndefined();
  });
});
