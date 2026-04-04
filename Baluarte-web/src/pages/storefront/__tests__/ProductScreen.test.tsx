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
    expect(onAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: "fla-home-2024" }), "M", undefined, undefined);
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

  it("shows personalization entry point only when customization is enabled and template exists", () => {
    const onAddToCart = jest.fn();
    const productWithCustomization: Product = {
      ...buildProduct(),
      customizationEnabled: true,
      customizationTemplatePng: "https://example.com/templates/flamengo-home.png"
    };

    render(
      <ProductScreen
        product={productWithCustomization}
        onBackToTeam={() => undefined}
        onBackHome={() => undefined}
        onAddToCart={onAddToCart}
        onGoCart={() => undefined}
      />
    );

    expect(screen.getByText("Personalizacao disponivel")).toBeTruthy();
    expect(screen.getByText("Personalizar camisa")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Ex: JOAO")).toBeNull();
    expect(screen.queryByPlaceholderText("Ex: 08")).toBeNull();

    fireEvent.press(screen.getByText("Personalizar camisa"));
    expect(screen.getByText("Ocultar personalizacao")).toBeTruthy();
    expect(screen.getByPlaceholderText("Ex: JOAO")).toBeTruthy();
    expect(screen.getByPlaceholderText("Ex: 08")).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText("Ex: JOAO"), "NOME-MUITO-LONGO-12345");
    fireEvent.press(screen.getByText("Adicionar nome"));
    expect(screen.getByText("Nome personalizado deve ter no maximo 14 caracteres.")).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText("Ex: JOAO"), "JOAO");
    fireEvent.press(screen.getByText("Adicionar nome"));
    fireEvent.changeText(screen.getByPlaceholderText("Ex: JOAO"), "PIRES");
    fireEvent.press(screen.getByText("Adicionar nome"));
    expect(screen.getByText("Nomes personalizados: 2 | Acrescimo: R$ 50,00")).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText("Ex: 08"), "08");
    fireEvent.press(screen.getByText("Adicionar numero"));
    expect(screen.getByText("Numero personalizado: 08")).toBeTruthy();
    expect(screen.getByText("Preview da personalizacao")).toBeTruthy();
    expect(screen.getByTestId("personalization-preview-template")).toBeTruthy();
    expect(screen.getByText("JOAO PIRES")).toBeTruthy();
    expect(screen.getAllByText("08").length).toBeGreaterThan(0);

    fireEvent.changeText(screen.getByPlaceholderText("Ex: 08"), "A8");
    fireEvent.press(screen.getByText("Adicionar numero"));
    expect(screen.getByText("Numero personalizado deve conter apenas digitos (0-9) com 1 ou 2 caracteres.")).toBeTruthy();
    expect(screen.getByText("Numero personalizado: 08")).toBeTruthy();

    fireEvent.press(screen.getByText("M"));
    fireEvent.press(screen.getByText("Adicionar ao carrinho"));

    expect(onAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: "fla-home-2024" }),
      "M",
      ["JOAO", "PIRES"],
      "08"
    );
  });

  it("keeps full-name input as a single personalization entry", () => {
    const onAddToCart = jest.fn();
    const productWithCustomization: Product = {
      ...buildProduct(),
      customizationEnabled: true,
      customizationTemplatePng: "https://example.com/templates/flamengo-home.png"
    };

    render(
      <ProductScreen
        product={productWithCustomization}
        onBackToTeam={() => undefined}
        onBackHome={() => undefined}
        onAddToCart={onAddToCart}
        onGoCart={() => undefined}
      />
    );

    fireEvent.press(screen.getByText("Personalizar camisa"));
    fireEvent.changeText(screen.getByPlaceholderText("Ex: JOAO"), "JOAO PIRES");
    fireEvent.press(screen.getByText("Adicionar nome"));

    expect(screen.getByText("Nomes personalizados: 1 | Acrescimo: R$ 25,00")).toBeTruthy();
    expect(screen.getByText("JOAO PIRES")).toBeTruthy();

    fireEvent.press(screen.getByText("M"));
    fireEvent.press(screen.getByText("Adicionar ao carrinho"));

    expect(onAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: "fla-home-2024" }),
      "M",
      ["JOAO PIRES"],
      undefined
    );
  });

  it("allows standard purchase even when personalization is available", () => {
    const onAddToCart = jest.fn();
    const productWithCustomization: Product = {
      ...buildProduct(),
      customizationEnabled: true,
      customizationTemplatePng: "https://example.com/templates/flamengo-home.png"
    };

    render(
      <ProductScreen
        product={productWithCustomization}
        onBackToTeam={() => undefined}
        onBackHome={() => undefined}
        onAddToCart={onAddToCart}
        onGoCart={() => undefined}
      />
    );

    fireEvent.press(screen.getByText("M"));
    fireEvent.press(screen.getByText("Adicionar ao carrinho"));

    expect(onAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: "fla-home-2024" }), "M", undefined, undefined);
  });

  it("hides personalization entry point when customization is disabled", () => {
    const productWithoutCustomization: Product = {
      ...buildProduct(),
      customizationEnabled: false,
      customizationTemplatePng: "https://example.com/templates/flamengo-home.png"
    };

    render(
      <ProductScreen
        product={productWithoutCustomization}
        onBackToTeam={() => undefined}
        onBackHome={() => undefined}
        onAddToCart={() => undefined}
        onGoCart={() => undefined}
      />
    );

    expect(screen.queryByText("Personalizacao disponivel")).toBeNull();
    expect(screen.queryByText("Personalizar camisa")).toBeNull();
  });
});
