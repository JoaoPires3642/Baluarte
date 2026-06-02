import { act, renderHook } from "@testing-library/react-native";

import { useCartState } from "../useCartState";
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
    customizationEnabled: true,
    customizationTemplatePng: "https://example.com/templates/flamengo-home.png",
    sizes: PRODUCT_SIZES,
    stockBySize: stockBySize({ M: 2 }),
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

    product.stockBySize = stockBySize();

    act(() => {
      result.current.updateCartQuantity(product.id, "M", 1);
    });

    expect(result.current.cartItems).toHaveLength(0);

    act(() => {
      result.current.addToCart(product, "M");
    });

    expect(result.current.cartItems).toHaveLength(0);
  });

  it("recalculates subtotal and total when quantity changes and item is removed", () => {
    const { result } = renderHook(() => useCartState());
    const product = buildProduct();

    act(() => {
      result.current.addToCart(product, "M");
      result.current.setShipping(25);
    });

    expect(result.current.subtotal).toBeCloseTo(299.9, 2);
    expect(result.current.total).toBeCloseTo(324.9, 2);

    act(() => {
      result.current.updateCartQuantity(product.id, "M", 2);
    });

    expect(result.current.subtotal).toBeCloseTo(599.8, 2);
    expect(result.current.total).toBeCloseTo(624.8, 2);

    act(() => {
      result.current.updateCartQuantity(product.id, "M", 0);
    });

    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.total).toBe(25);
  });

  it("adds BRL 25 per custom name and reflects quantity in customization subtotal", () => {
    const { result } = renderHook(() => useCartState());
    const product = buildProduct();

    act(() => {
      result.current.addToCart(product, "M", ["JOAO", "MARIA"]);
    });

    expect(result.current.customizationNameCount).toBe(2);
    expect(result.current.customizationSubtotal).toBe(50);
    expect(result.current.baseSubtotal).toBeCloseTo(299.9, 2);
    expect(result.current.subtotal).toBeCloseTo(349.9, 2);

    act(() => {
      result.current.updateCartQuantity(product.id, "M", 2);
    });

    expect(result.current.customizationNameCount).toBe(4);
    expect(result.current.customizationSubtotal).toBe(100);
    expect(result.current.baseSubtotal).toBeCloseTo(599.8, 2);
    expect(result.current.subtotal).toBeCloseTo(699.8, 2);
  });

  it("adds BRL 20 per custom-number digit preserving leading zeros", () => {
    const { result } = renderHook(() => useCartState());
    const product = buildProduct();

    act(() => {
      result.current.addToCart(product, "M", [], "08");
    });

    expect(result.current.customizationNumberDigitCount).toBe(2);
    expect(result.current.customizationNumberSubtotal).toBe(40);
    expect(result.current.baseSubtotal).toBeCloseTo(299.9, 2);
    expect(result.current.subtotal).toBeCloseTo(339.9, 2);

    act(() => {
      result.current.updateCartQuantity(product.id, "M", 2);
    });

    expect(result.current.customizationNumberDigitCount).toBe(4);
    expect(result.current.customizationNumberSubtotal).toBe(80);
    expect(result.current.baseSubtotal).toBeCloseTo(599.8, 2);
    expect(result.current.subtotal).toBeCloseTo(679.8, 2);
    expect(result.current.cartItems[0].customizationSnapshot).toEqual({
      templatePng: "https://example.com/templates/flamengo-home.png",
      names: [],
      number: "08"
    });
  });

  it("updates/removes only the targeted personalization variant", () => {
    const { result } = renderHook(() => useCartState());
    const product = buildProduct();

    act(() => {
      result.current.addToCart(product, "M", ["JOAO"], "10");
      result.current.addToCart(product, "M", ["MARIA"], "11");
    });

    expect(result.current.cartItems).toHaveLength(2);
    expect(result.current.cartItems[0].quantity).toBe(1);
    expect(result.current.cartItems[1].quantity).toBe(1);

    act(() => {
      result.current.updateCartQuantity(product.id, "M", 2, ["JOAO"], "10");
    });

    expect(result.current.cartItems).toHaveLength(2);
    expect(result.current.cartItems.find((item) => item.customNumber === "10")?.quantity).toBe(2);
    expect(result.current.cartItems.find((item) => item.customNumber === "11")?.quantity).toBe(1);

    act(() => {
      result.current.updateCartQuantity(product.id, "M", 0, ["MARIA"], "11");
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].customNumber).toBe("10");
  });
});
