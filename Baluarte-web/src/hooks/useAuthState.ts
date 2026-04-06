import { useCallback, useEffect, useRef, useState } from "react";

import type { Address, User } from "../lib/types";
import {
  listProfileAddressesApi,
  mapProfileAddressDtoToAddress,
  syncProfileAddressesApi
} from "../lib/mobile/api/profile-addresses";
import {
  beginEmailCodeSignUp,
  beginEmailCodeLogin,
  isClerkConfigured,
  loginWithOAuth,
  resolveBackendSessionRole,
  signOutClerk,
  subscribeToClerkSessionChanges,
  verifyEmailCodeSignUp,
  verifyEmailCodeLogin
} from "../lib/clerkClient";

type DemoUser = User & { password: string };

export type AuthSession = {
  token: string;
  internalRole: User["role"];
  provider: "demo" | "clerk";
  issuedAt: string;
};

export type SecurityAuditEvent = {
  id: string;
  type: "login-failed" | "admin-access-denied";
  reason: string;
  email?: string;
  route?: string;
  timestamp: string;
};

export type LoginResult =
  | { ok: true; internalRole: User["role"] }
  | { ok: false; error?: string };

const DEMO_USERS: DemoUser[] = [
  {
    id: "admin-1",
    name: "Admin",
    email: "admin@loja.com",
    role: "admin",
    password: "admin123"
  },
  {
    id: "client-1",
    name: "Joao Silva",
    email: "joao@email.com",
    role: "client",
    password: "123456",
    defaultAddress: {
      cep: "01310-100",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "Sao Paulo",
      state: "SP"
    },
    addresses: [
      {
        id: "addr-home",
        label: "Casa",
        cep: "01310-100",
        street: "Av. Paulista",
        number: "1000",
        neighborhood: "Bela Vista",
        city: "Sao Paulo",
        state: "SP"
      },
      {
        id: "addr-work",
        label: "Trabalho",
        cep: "01330-000",
        street: "Av. Paulista",
        number: "500",
        neighborhood: "Bela Vista",
        city: "Sao Paulo",
        state: "SP"
      }
    ],
    defaultAddressId: "addr-home"
  }
];

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<DemoUser[]>(DEMO_USERS);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [securityAuditEvents, setSecurityAuditEvents] = useState<SecurityAuditEvent[]>([]);
  const [pendingClerkEmail, setPendingClerkEmail] = useState<string | null>(null);
  const [pendingClerkSignUpEmail, setPendingClerkSignUpEmail] = useState<string | null>(null);
  const lastHydratedClerkIdentityKeyRef = useRef<string | null>(null);
  const lastHydratedClerkRoleRef = useRef<User["role"]>("client");

  const createSessionToken = (role: User["role"]) => {
    const now = Date.now();
    return `sess-${role}-${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const recordSecurityEvent = (event: Omit<SecurityAuditEvent, "id" | "timestamp">) => {
    const nextEvent: SecurityAuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString()
    };
    setSecurityAuditEvents((prev) => [nextEvent, ...prev]);
  };

  const buildProfileAddressApiOptions = (
    clerkIdentity: { userId: string; email: string; sessionToken?: string },
    internalRole: User["role"]
  ) => {
    if (!clerkIdentity?.sessionToken) {
      return null;
    }

    return {
      authorizationContext: {
        clerkIdentity: {
          clerkUserId: clerkIdentity.userId,
          email: clerkIdentity.email
        },
        internalRole
      },
      bearerToken: clerkIdentity.sessionToken
    };
  };

  const buildProfileAddressApiOptionsFromSession = (
    sessionToken: string | undefined,
    clerkUserId: string,
    clerkEmail: string,
    internalRole: User["role"]
  ) => {
    const normalizedSessionToken = sessionToken?.trim();
    if (!normalizedSessionToken) {
      return null;
    }

    return {
      authorizationContext: {
        clerkIdentity: {
          clerkUserId,
          email: clerkEmail
        },
        internalRole
      },
      bearerToken: normalizedSessionToken
    };
  };

  const applyAddressesToCurrentUser = useCallback((addresses: Address[], defaultAddressId?: string) => {
    const normalizedAddresses = addresses.map((address) => ({
      ...address,
      label: address.label?.trim() || "Endereco"
    }));
    const resolvedDefaultAddressId =
      defaultAddressId || normalizedAddresses.find((address) => address.id)?.id || undefined;
    const defaultAddress = normalizedAddresses.find((address) => address.id === resolvedDefaultAddressId) ?? normalizedAddresses[0];

    setUsers((prev) =>
      prev.map((item) =>
        user && item.id === user.id
          ? {
              ...item,
              addresses: normalizedAddresses,
              defaultAddressId: resolvedDefaultAddressId,
              defaultAddress
            }
          : item
      )
    );

    setUser((prev) =>
      prev
        ? {
            ...prev,
            addresses: normalizedAddresses,
            defaultAddressId: resolvedDefaultAddressId,
            defaultAddress
          }
        : prev
    );
  }, [user]);

  const refreshClerkAddresses = useCallback(async (
    clerkIdentity: { userId: string; email: string; sessionToken?: string },
    internalRole: User["role"]
  ) => {
    const options = buildProfileAddressApiOptions(clerkIdentity, internalRole);
    if (!options) {
      return;
    }

    const addressDtos = await listProfileAddressesApi(options);
    const addresses = addressDtos.map(mapProfileAddressDtoToAddress);
    const defaultAddress = addressDtos.find((address) => address.isDefault)?.id;
    applyAddressesToCurrentUser(addresses, defaultAddress);
  }, [applyAddressesToCurrentUser]);

  const createUserFromClerkIdentity = useCallback((identity: {
    userId: string;
    email: string;
    fullName?: string;
  }, role: User["role"]): User => {
    const normalizedEmail = identity.email.trim().toLowerCase();

    return {
      id: identity.userId,
      name: identity.fullName || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      role
    };
  }, []);

  const applyClerkIdentityToSession = useCallback((identity: {
    userId: string;
    email: string;
    fullName?: string;
    sessionToken?: string;
  }, role: User["role"]): User["role"] => {
    const nextUser = createUserFromClerkIdentity(identity, role);

    setUser(nextUser);
    setAuthSession({
      token: identity.sessionToken || createSessionToken(role),
      internalRole: role,
      provider: "clerk",
      issuedAt: new Date().toISOString()
    });

    return role;
  }, [createUserFromClerkIdentity]);

  const syncClerkIdentityWithBackend = useCallback(async (identity: {
    userId: string;
    email: string;
    fullName?: string;
    sessionToken?: string;
  }): Promise<User["role"]> => {
    const hydrationKey = `${identity.userId}:${identity.email.trim().toLowerCase()}`;
    if (lastHydratedClerkIdentityKeyRef.current === hydrationKey) {
      return lastHydratedClerkRoleRef.current;
    }

    const backendSession = await resolveBackendSessionRole(identity);
    const resolvedRole = applyClerkIdentityToSession(identity, backendSession.role);
    lastHydratedClerkIdentityKeyRef.current = hydrationKey;
    lastHydratedClerkRoleRef.current = resolvedRole;
    await refreshClerkAddresses(identity, backendSession.role);
    return resolvedRole;
  }, [applyClerkIdentityToSession, refreshClerkAddresses]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    if (!isClerkConfigured()) {
      return () => {
        active = false;
      };
    }

    void subscribeToClerkSessionChanges((identity) => {
      if (!active) {
        return;
      }

      if (!identity) {
        setUser(null);
        setAuthSession(null);
        lastHydratedClerkIdentityKeyRef.current = null;
        lastHydratedClerkRoleRef.current = "client";
        return;
      }

      void syncClerkIdentityWithBackend(identity);
    })
      .then((cleanup) => {
        unsubscribe = cleanup;
      })
      .catch(() => {
        // Ignore listener initialization failure and keep app usable.
      });

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [syncClerkIdentityWithBackend]);

  const startEmailOtpLogin = async (email: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    const response = await beginEmailCodeLogin(email);
    if (!response.ok) {
      return response;
    }

    setPendingClerkEmail(email.trim().toLowerCase());
    return { ok: true };
  };

  const verifyEmailOtpLogin = async (code: string): Promise<LoginResult> => {
    if (!pendingClerkEmail) {
      return { ok: false, error: "Solicite o codigo OTP antes de validar." };
    }

    const result = await verifyEmailCodeLogin(code);
    if (!result.ok) {
      recordSecurityEvent({
        type: "login-failed",
        reason: "invalid-otp",
        email: pendingClerkEmail
      });
      return { ok: false, error: result.error };
    }

    const role = await syncClerkIdentityWithBackend(result.identity);
    setPendingClerkEmail(null);
    return { ok: true, internalRole: role };
  };

  const startEmailOtpRegister = async (
    firstName: string,
    lastName: string,
    email: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const response = await beginEmailCodeSignUp(firstName, lastName, email);
    if (!response.ok) {
      return response;
    }

    setPendingClerkSignUpEmail(email.trim().toLowerCase());
    return { ok: true };
  };

  const verifyEmailOtpRegister = async (code: string): Promise<LoginResult> => {
    if (!pendingClerkSignUpEmail) {
      return { ok: false, error: "Inicie o cadastro antes de validar o codigo." };
    }

    const result = await verifyEmailCodeSignUp(code);
    if (!result.ok) {
      recordSecurityEvent({
        type: "login-failed",
        reason: "invalid-register-otp",
        email: pendingClerkSignUpEmail
      });
      return { ok: false, error: result.error };
    }

    const role = await syncClerkIdentityWithBackend(result.identity);
    setPendingClerkSignUpEmail(null);
    return { ok: true, internalRole: role };
  };

  const loginWithClerkOAuth = async (provider: "google" | "apple"): Promise<LoginResult> => {
    const oauth = await loginWithOAuth(provider);
    if (!oauth.ok) {
      recordSecurityEvent({
        type: "login-failed",
        reason: `oauth-${provider}-failed`
      });
      return { ok: false, error: oauth.error };
    }

    return { ok: false, error: "Redirecionando para autenticacao do Clerk..." };
  };

  const handleLogin = async (email: string, password: string): Promise<LoginResult> => {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const found = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!found) {
      recordSecurityEvent({
        type: "login-failed",
        reason: "invalid-credentials",
        email: email.trim().toLowerCase()
      });
      return { ok: false };
    }
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    setAuthSession({
      token: createSessionToken(safeUser.role),
      internalRole: safeUser.role,
      provider: "demo",
      issuedAt: new Date().toISOString()
    });
    return { ok: true, internalRole: safeUser.role };
  };

  const handleRegister = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return { ok: false, error: "Informe seu nome" };
    }
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { ok: false, error: "Informe um email valido" };
    }
    if (password.length < 6) {
      return { ok: false, error: "A senha deve ter no minimo 6 caracteres" };
    }

    const exists = users.some((item) => item.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return { ok: false, error: "Este email ja esta cadastrado" };
    }

    const nextUser: DemoUser = {
      id: `client-${Date.now()}`,
      name: trimmedName,
      email: normalizedEmail,
      role: "client",
      password
    };

    setUsers((prev) => [...prev, nextUser]);
    const { password: _, ...safeUser } = nextUser;
    setUser(safeUser);
    setAuthSession({
      token: createSessionToken(safeUser.role),
      internalRole: safeUser.role,
      provider: "demo",
      issuedAt: new Date().toISOString()
    });
    return { ok: true };
  };

  const handleLogout = () => {
    void signOutClerk();
    setUser(null);
    setAuthSession(null);
    setPendingClerkEmail(null);
    setPendingClerkSignUpEmail(null);
    lastHydratedClerkIdentityKeyRef.current = null;
    lastHydratedClerkRoleRef.current = "client";
  };

  const accountLabel = !user ? "Perfil" : user.role === "admin" ? "Admin" : "Perfil";

  const updateUserAddress = async (address: Address): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!user) {
      return { ok: false, error: "Usuario nao autenticado" };
    }
    const cepDigits = address.cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      return { ok: false, error: "Informe um CEP valido com 8 digitos" };
    }
    if (!address.street.trim() || !address.number.trim() || !address.neighborhood.trim() || !address.city.trim() || !address.state.trim()) {
      return { ok: false, error: "Preencha todos os campos obrigatorios do endereco" };
    }

    const normalizedAddress: Address = {
      ...address,
      id: address.id || `addr-${Date.now()}`,
      label: address.label || "Endereco",
      cep: address.cep.trim(),
      street: address.street.trim(),
      number: address.number.trim(),
      complement: address.complement?.trim() || undefined,
      neighborhood: address.neighborhood.trim(),
      city: address.city.trim(),
      state: address.state.trim().toUpperCase()
    };

    const nextAddresses = [...(user.addresses ?? [])];
    const existingIndex = nextAddresses.findIndex((item) => item.id === normalizedAddress.id);

    if (existingIndex === -1) {
      nextAddresses.push(normalizedAddress);
    } else {
      nextAddresses[existingIndex] = normalizedAddress;
    }

    const nextDefaultAddressId = user.defaultAddressId || normalizedAddress.id;

    return updateUserAddresses(nextAddresses, nextDefaultAddressId);
  };

  const updateUserAddresses = async (
    addresses: Address[],
    defaultAddressId?: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!user) {
      return { ok: false, error: "Usuario nao autenticado" };
    }

    const resolvedDefaultAddressId = defaultAddressId || addresses.find((address) => address.id)?.id;

    if (authSession?.provider === "clerk") {
      const options = buildProfileAddressApiOptionsFromSession(
        authSession.token,
        user.id,
        user.email,
        authSession.internalRole
      );

      if (!options) {
        return { ok: false, error: "Sessao de autenticacao indisponivel" };
      }

      try {
        const persisted = await syncProfileAddressesApi(
          {
            defaultAddressId: resolvedDefaultAddressId,
            addresses: addresses.map((address) => ({
              id: address.id,
              label: address.label ?? "Endereco",
              cep: address.cep,
              street: address.street,
              number: address.number,
              complement: address.complement,
              neighborhood: address.neighborhood,
              city: address.city,
              state: address.state
            }))
          },
          options
        );

        const nextAddresses = persisted.map(mapProfileAddressDtoToAddress);
        const nextDefaultAddressId = persisted.find((address) => address.isDefault)?.id;
        applyAddressesToCurrentUser(nextAddresses, nextDefaultAddressId);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Nao foi possivel salvar os enderecos"
        };
      }
    }

    applyAddressesToCurrentUser(addresses, resolvedDefaultAddressId);
    return { ok: true };
  };

  return {
    user,
    setUser,
    authSession,
    setAuthSession,
    securityAuditEvents,
    recordSecurityEvent,
    handleLogout,
    handleLogin,
    startEmailOtpLogin,
    verifyEmailOtpLogin,
    startEmailOtpRegister,
    verifyEmailOtpRegister,
    loginWithClerkOAuth,
    handleRegister,
    updateUserAddress,
    updateUserAddresses,
    accountLabel
  };
}
