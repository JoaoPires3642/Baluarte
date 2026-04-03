import { fetchPublicModelsByTeam, fetchPublicTeamsByCategory } from "../catalog";

describe("catalog mobile api helpers", () => {
  const previousUseMock = process.env.EXPO_PUBLIC_USE_MOCK_CATEGORIES;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCK_CATEGORIES = "true";
  });

  afterAll(() => {
    if (previousUseMock === undefined) {
      delete process.env.EXPO_PUBLIC_USE_MOCK_CATEGORIES;
      return;
    }

    process.env.EXPO_PUBLIC_USE_MOCK_CATEGORIES = previousUseMock;
  });

  it("returns teams for selected category in mock mode", async () => {
    const teams = await fetchPublicTeamsByCategory("nacionais");

    expect(teams.length).toBeGreaterThan(0);
    expect(teams.every((team) => team.categorySlug === "nacionais")).toBe(true);
  });

  it("returns empty teams list for unknown category in mock mode", async () => {
    const teams = await fetchPublicTeamsByCategory("categoria-inexistente");

    expect(teams).toEqual([]);
  });

  it("returns available models for selected team in mock mode", async () => {
    const models = await fetchPublicModelsByTeam("flamengo");

    expect(models.length).toBeGreaterThan(0);
    expect(models.every((model) => model.teamSlug === "flamengo")).toBe(true);
  });
});
