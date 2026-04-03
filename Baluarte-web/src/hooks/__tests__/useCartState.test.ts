import { act, renderHook } from "@testing-library/react-native";

import { useCartState } from "../useCartState";
import type { Product } from "../../lib/types";

function buildProduct(): Product {
  return {
    id: "fla-home-2024",
    name: "Camisa Flamengo I 2024",
    description: "Camisa oficial",
    price: 299.9,
    image: "https://example.com/product.png",
    teamId: "flamengo",
    team: {
      id: "flamengo",
      name: "Flamengo",
      logo: "https://example.com/logo.png",
      category: "nacionais",
      league: "Serie A"
    },
    sizes: ["P", "M", "G", "GG"],
    stockBySize: { P: 0, M: 2, G: 0, GG: 0 },
    inStock: true
  };
}

describe("useCartState", () => {
  it("removes cart item when quantity update is requested but variant stock becomes zero", () => {
    const { result } = renderHook(() => useCartState());
    const product = buildProduct();

    act(() => {
      result.current.addToCart(product, "M");
    });

    expect(result.current.cartItems).toHaveLength(1);

    product.stockBySize = { P: 0, M: 0, G: 0, GG: 0 };

    act(() => {
      result.current.updateCartQuantity(product.id, "M", 1);
    });

    expect(result.current.cartItems).toHaveLength(0);

    act(() => {
      result.current.addToCart(product, "M");
    });

    expect(result.current.cartItems).toHaveLength(0);
  });
});
