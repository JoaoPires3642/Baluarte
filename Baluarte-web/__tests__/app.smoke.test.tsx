import { render, screen, waitFor } from "@testing-library/react-native";

import App from "../App";

describe("App smoke", () => {
  it("boots and renders storefront category and featured product sections", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText("Categorias").length).toBeGreaterThan(0);
      expect(screen.getByText("Nacionais")).toBeTruthy();
      expect(screen.getByText("Mais Vendidos")).toBeTruthy();
      expect(screen.getByText("Ver Todos")).toBeTruthy();
      expect(screen.getAllByText("Ver Colecao →").length).toBeGreaterThan(0);
    });
  });
});
