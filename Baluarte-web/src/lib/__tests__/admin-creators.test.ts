import { createAdminProduct } from "../admin-creators";
import type { Team } from "../types";

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
      { P: 1, M: 2, G: 3, GG: 4 },
      undefined,
      true,
      "https://example.com/templates/flamengo-home.png"
    );

    expect(product.customizationEnabled).toBe(true);
    expect(product.customizationTemplatePng).toBe("https://example.com/templates/flamengo-home.png");
  });

  it("defaults customization metadata to disabled and empty template", () => {
    const product = createAdminProduct(
      "Camisa Flamengo I",
      "Oficial",
      299.9,
      ["https://example.com/product.jpg"],
      team,
      { P: 1, M: 2, G: 3, GG: 4 }
    );

    expect(product.customizationEnabled).toBe(false);
    expect(product.customizationTemplatePng).toBeUndefined();
  });
});
