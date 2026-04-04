import { render, screen } from "@testing-library/react-native";

import { CartScreen } from "../CartScreen";
import type { CartItem, Product } from "../../../lib/types";

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
    stockBySize: { P: 0, M: 5, G: 2, GG: 0 },
    inStock: true,
    customizationEnabled: true,
    customizationTemplatePng: "https://example.com/templates/flamengo-home.png"
  };
}

describe("CartScreen", () => {
  it("renders base and customization breakdown lines separately", () => {
    const item: CartItem = {
      product: buildProduct(),
      size: "M",
      quantity: 1,
      customNames: ["JOAO"],
      customNumber: "08",
      customizationSnapshot: {
        templatePng: "https://example.com/templates/flamengo-home.png",
        names: ["JOAO"],
        number: "08"
      }
    };

    render(
      <CartScreen
        items={[item]}
        subtotal={299.9}
        customizationNameCount={1}
        customizationSubtotal={25}
        customizationNumberDigitCount={2}
        customizationNumberSubtotal={40}
        shipping={0}
        discount={0}
        total={364.9}
        appliedCoupon={null}
        onApplyCoupon={() => ({ ok: true })}
        onRemoveCoupon={() => undefined}
        onSetShipping={() => undefined}
        onUpdateQuantity={() => undefined}
        onClearCart={() => undefined}
        onBackHome={() => undefined}
        onCheckout={() => undefined}
      />
    );

    expect(screen.getByText("Base (1x): R$ 299,90")).toBeTruthy();
    expect(screen.getByText("Ajuste nomes: R$ 25,00")).toBeTruthy();
    expect(screen.getByText("Ajuste numero: R$ 40,00")).toBeTruthy();
    expect(screen.getByText("Subtotal")).toBeTruthy();
    expect(screen.getByText("R$ 299,90")).toBeTruthy();
    expect(screen.getByText("Total do item: R$ 364,90")).toBeTruthy();
  });
});
