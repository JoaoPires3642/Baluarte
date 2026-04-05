import { resolveBackendSessionRole } from "../clerkClient";

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

describe("clerkClient session sync", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("returns backend role when session sync succeeds", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: {
            userId: "user_123",
            email: "cliente@baluarte.com",
            internalRole: "ADMIN"
          }
        })
    });

    const result = await resolveBackendSessionRole({
      userId: "user_123",
      email: "cliente@baluarte.com",
      sessionToken: "token_abc"
    });

    expect(result).toEqual({
      ok: true,
      role: "admin",
      session: {
        userId: "user_123",
        email: "cliente@baluarte.com",
        internalRole: "ADMIN"
      }
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/session"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token_abc",
          "X-Clerk-User-Id": "user_123",
          "X-Clerk-Email": "cliente@baluarte.com"
        })
      })
    );
  });

  it("falls back to client role when backend denies session", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { code: "UNAUTHORIZED" } })
    });

    const result = await resolveBackendSessionRole({
      userId: "user_123",
      email: "cliente@baluarte.com",
      sessionToken: "token_abc"
    });

    expect(result).toEqual({
      ok: false,
      role: "client",
      status: 401,
      error: "Backend nao autorizou a sessao Clerk."
    });
  });

  it("returns client fallback when session token is missing", async () => {
    const result = await resolveBackendSessionRole({
      userId: "user_123",
      email: "cliente@baluarte.com"
    });

    expect(result).toEqual({
      ok: false,
      role: "client",
      error: "Sessao Clerk sem token de autenticacao."
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
