import { render, screen } from "@testing-library/react-native";

import { TeamScreen } from "../TeamScreen";

describe("TeamScreen", () => {
  it("shows explicit empty state when team has no models", () => {
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
        onBack={() => undefined}
        onSelectProduct={() => undefined}
      />
    );

    expect(screen.getByText("Nenhum modelo disponivel para este time no momento.")).toBeTruthy();
  });
});
