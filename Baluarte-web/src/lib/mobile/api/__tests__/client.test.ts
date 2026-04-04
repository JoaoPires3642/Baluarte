import { ApiClient } from "../client";
import { resolveInternalRoleFromClerkIdentity } from "../contracts";

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

describe("ApiClient", () => {
  const previousNavigator = global.navigator;

  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: previousNavigator
    });
  });

  it("returns success envelope data and meta", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [{ id: "1", name: "Camisas", slug: "camisas" }],
          meta: { page: 1 }
        }),
      headers: { get: () => null }
    });

    const client = new ApiClient("http://localhost:8080/api/v1");
    const result = await client.request<{ id: string; name: string; slug: string }[]>("/catalog/categories");

    expect(result.data[0].slug).toBe("camisas");
    expect(result.meta).toEqual({ page: 1 });
  });

  it("normalizes backend error envelope and preserves traceId", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: {
            code: "CATALOG_UNAVAILABLE",
            message: "Catalog service offline",
            details: { reason: "downstream-timeout", stackTrace: "secret" }
          },
          traceId: "trace-123"
        }),
      headers: { get: () => null }
    });

    const client = new ApiClient("http://localhost:8080/api/v1");

    await expect(client.request("/catalog/categories")).rejects.toMatchObject({
      code: "CATALOG_UNAVAILABLE",
      message: "Catalog service offline",
      traceId: "trace-123",
      status: 400
    });
  });

  it("normalizes abort-like timeout errors in Expo/React Native runtime", async () => {
    fetchMock.mockRejectedValue({
      name: "AbortError",
      message: "The operation was aborted"
    });

    const client = new ApiClient("http://localhost:8080/api/v1");

    await expect(client.request("/catalog/categories")).rejects.toMatchObject({
      code: "UNEXPECTED_ERROR",
      message: "Tempo limite excedido ao chamar a API."
    });
  });

  it("fails fast with actionable message when localhost is used on Expo Go device", async () => {
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { product: "ReactNative" }
    });

    const client = new ApiClient("http://localhost:8080/api/v1");

    await expect(client.request("/catalog/categories")).rejects.toMatchObject({
      code: "API_BASE_URL_NOT_CONFIGURED",
      message: expect.stringContaining("EXPO_PUBLIC_API_BASE_URL")
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps Clerk identity to internal role and forwards auth headers", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { ok: true } }),
      headers: { get: () => null }
    });

    const client = new ApiClient("http://localhost:8080/api/v1");
    await client.request("/admin/orders", {
      method: "GET",
      authorizationContext: {
        clerkIdentity: {
          clerkUserId: "user_123",
          email: "admin@loja.com"
        },
        internalRole: "admin"
      }
    });

    expect(resolveInternalRoleFromClerkIdentity({ clerkUserId: "user_123", email: "admin@loja.com" }, ["admin@loja.com"])).toBe("admin");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/orders"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Clerk-User-Id": "user_123",
          "X-Clerk-Email": "admin@loja.com",
          "X-Internal-Role": "admin"
        })
      })
    );
  });
});
