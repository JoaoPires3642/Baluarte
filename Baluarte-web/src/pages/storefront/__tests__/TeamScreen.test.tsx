import { fireEvent, render, screen } from "@testing-library/react-native";

import { TeamScreen } from "../TeamScreen";

describe("TeamScreen", () => {
  it("shows explicit empty state when team has no models", () => {
    const onChangeSearchQuery = jest.fn();

    render(
      <TeamScreen
        team={{
          id: "flamengo",
          name: "Flamengo",
          logo: "https://example.com/flamengo.png",
          category: "nacionais",
          league: "Serie A"
        }}
        products={[]}
        searchQuery=""
        selectedSize={null}
        inStockOnly={false}
        onSaleOnly={false}
        onChangeSearchQuery={onChangeSearchQuery}
        onToggleSize={() => undefined}
        onToggleInStockOnly={() => undefined}
        onToggleOnSaleOnly={() => undefined}
        onClearFilters={() => undefined}
        onBack={() => undefined}
        onSelectProduct={() => undefined}
      />
    );

    expect(screen.getByText("Nenhum modelo disponivel para este time no momento.")).toBeTruthy();
  });

  it("emits search and filter interactions", () => {
    const onChangeSearchQuery = jest.fn();
    const onToggleSize = jest.fn();
    const onToggleInStockOnly = jest.fn();
    const onToggleOnSaleOnly = jest.fn();
    const onClearFilters = jest.fn();

    render(
      <TeamScreen
        team={{
          id: "flamengo",
          name: "Flamengo",
          logo: "https://example.com/flamengo.png",
          category: "nacionais",
          league: "Serie A"
        }}
        products={[]}
        searchQuery="camisa"
        selectedSize={null}
        inStockOnly={false}
        onSaleOnly={false}
        onChangeSearchQuery={onChangeSearchQuery}
        onToggleSize={onToggleSize}
        onToggleInStockOnly={onToggleInStockOnly}
        onToggleOnSaleOnly={onToggleOnSaleOnly}
        onClearFilters={onClearFilters}
        onBack={() => undefined}
        onSelectProduct={() => undefined}
      />
    );

    fireEvent.changeText(screen.getByPlaceholderText("Buscar por nome do produto"), "retro");
    fireEvent.press(screen.getByText("Disponiveis"));
    fireEvent.press(screen.getByText("Com desconto"));
    fireEvent.press(screen.getByText("Tam M"));
    fireEvent.press(screen.getByText("Limpar filtros"));

    expect(onChangeSearchQuery).toHaveBeenCalledWith("retro");
    expect(onToggleInStockOnly).toHaveBeenCalledTimes(1);
    expect(onToggleOnSaleOnly).toHaveBeenCalledTimes(1);
    expect(onToggleSize).toHaveBeenCalledWith("M");
    expect(onClearFilters).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Nenhum modelo encontrado com os filtros aplicados.")).toBeTruthy();
  });
});
