import { fireEvent, render, screen } from "@testing-library/react-native";

import { ProductScreen } from "../ProductScreen";
import type { Product } from "../../../lib/types";

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
    inStock: true
  };
}

describe("ProductScreen", () => {
  it("blocks add-to-cart when no variant is selected", () => {
    const onAddToCart = jest.fn();

    render(
      <ProductScreen
        product={buildProduct()}
        onBackToTeam={() => undefined}
        onBackHome={() => undefined}
        onAddToCart={onAddToCart}
        onGoCart={() => undefined}
      />
    );

    fireEvent.press(screen.getByText("Selecionar tamanho"));

    expect(screen.getByText("Selecione um tamanho antes de adicionar ao carrinho.")).toBeTruthy();
    expect(onAddToCart).not.toHaveBeenCalled();
  });

  it("blocks unavailable variant and allows valid variant", () => {
    const onAddToCart = jest.fn();

    render(
      <ProductScreen
        product={buildProduct()}
        onBackToTeam={() => undefined}
        onBackHome={() => undefined}
        onAddToCart={onAddToCart}
        onGoCart={() => undefined}
      />
    );

    fireEvent.press(screen.getByText("P"));
    expect(screen.getByText("O tamanho P esta indisponivel. Escolha outro tamanho.")).toBeTruthy();
    expect(onAddToCart).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText("M"));
    fireEvent.press(screen.getByText("Adicionar ao carrinho"));

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: "fla-home-2024" }), "M");
  });

  it("treats missing stockBySize as unavailable and blocks add-to-cart", () => {
    const onAddToCart = jest.fn();
    const productWithoutVariantStock: Product = {
      ...buildProduct(),
      stockBySize: undefined,
      inStock: true
    };

    render(
      <ProductScreen
        product={productWithoutVariantStock}
        onBackToTeam={() => undefined}
        onBackHome={() => undefined}
        onAddToCart={onAddToCart}
        onGoCart={() => undefined}
      />
    );

    fireEvent.press(screen.getByText("M"));

    expect(screen.getByText("O tamanho M esta indisponivel. Escolha outro tamanho.")).toBeTruthy();
    expect(onAddToCart).not.toHaveBeenCalled();
  });
});
