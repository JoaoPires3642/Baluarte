import { act, renderHook } from "@testing-library/react-native";

import { useAuthState } from "../useAuthState";

describe("useAuthState", () => {
  it("creates admin session token with role after successful admin login", async () => {
    const { result } = renderHook(() => useAuthState());

    await act(async () => {
      const loginResult = await result.current.handleLogin("admin@loja.com", "admin123");
      expect(loginResult).toEqual({ ok: true, internalRole: "admin" });
    });

    expect(result.current.user?.role).toBe("admin");
    expect(result.current.authSession?.internalRole).toBe("admin");
    expect(result.current.authSession?.provider).toBe("demo");
    expect(result.current.authSession?.token).toContain("sess-admin-");
  });

  it("clears the auth session on logout", async () => {
    const { result } = renderHook(() => useAuthState());

    await act(async () => {
      const loginResult = await result.current.handleLogin("admin@loja.com", "admin123");
      expect(loginResult.ok).toBe(true);
    });

    act(() => {
      result.current.handleLogout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.authSession).toBeNull();
  });

  it("records security audit event when login credentials are invalid", async () => {
    const { result } = renderHook(() => useAuthState());

    await act(async () => {
      const loginResult = await result.current.handleLogin("admin@loja.com", "senha-errada");
      expect(loginResult).toEqual({ ok: false });
    });

    expect(result.current.user).toBeNull();
    expect(result.current.authSession).toBeNull();
    expect(result.current.securityAuditEvents.length).toBe(1);
    expect(result.current.securityAuditEvents[0]).toEqual(
      expect.objectContaining({
        type: "login-failed",
        reason: "invalid-credentials",
        email: "admin@loja.com"
      })
    );
  });
});
