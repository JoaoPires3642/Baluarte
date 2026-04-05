import { resolveApiV1BaseUrl } from "./mobile/env";

type ClerkOAuthProvider = "google" | "apple";

type BackendInternalRole = "admin" | "client";

type ApiSuccessEnvelope<TData> = {
  data: TData;
};

type AuthSessionResponse = {
  userId: string;
  email: string;
  internalRole: string;
};

export type ClerkIdentitySnapshot = {
  userId: string;
  email: string;
  fullName?: string;
  sessionToken?: string;
};

let clerkInstancePromise: Promise<unknown | null> | null = null;

function readPublishableKey(): string {
  return (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY ?? "").trim();
}

export function isClerkConfigured(): boolean {
  return readPublishableKey().length > 0;
}

function parseJsonSafely(value: string): unknown {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function resolveClerkErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: string;
      errors?: { message?: string; longMessage?: string; code?: string }[];
    };

    if (Array.isArray(maybeError.errors) && maybeError.errors.length > 0) {
      const message = maybeError.errors
        .map((entry) => entry.longMessage || entry.message || entry.code)
        .filter((value): value is string => Boolean(value && value.trim()))
        .join(" | ");
      if (message) {
        return message;
      }
    }

    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }
  }

  return fallback;
}

function resolveClerkErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const maybeError = error as {
    code?: string;
    errors?: { code?: string }[];
  };

  if (typeof maybeError.code === "string" && maybeError.code.trim()) {
    return maybeError.code.trim();
  }

  const nestedCode = maybeError.errors?.find((entry) => typeof entry.code === "string" && entry.code.trim())?.code;
  if (typeof nestedCode === "string" && nestedCode.trim()) {
    return nestedCode.trim();
  }

  return undefined;
}

function resolveClerkErrorDebugDetails(error: unknown): string {
  if ((process.env.NODE_ENV ?? "").toLowerCase() === "production") {
    return "";
  }

  const code = resolveClerkErrorCode(error);
  const message = resolveClerkErrorMessage(error, "");
  const details: string[] = [];

  if (code) {
    details.push(`code=${code}`);
  }

  if (message) {
    details.push(`message=${message}`);
  }

  if (details.length === 0) {
    return "";
  }

  return ` [debug: ${details.join(" | ")}]`;
}

function isCaptchaRelatedError(error: unknown): boolean {
  const code = resolveClerkErrorCode(error)?.toLowerCase();
  const message = resolveClerkErrorMessage(error, "").toLowerCase();

  return Boolean(
    code?.includes("captcha") ||
    code?.includes("challenge") ||
    message.includes("captcha") ||
    message.includes("challenge") ||
    message.includes("bot")
  );
}

function isReusableSignUpAttempt(signUp: any, normalizedEmail: string): boolean {
  const signUpId = String(signUp?.id ?? "").trim();
  if (!signUpId) {
    return false;
  }

  const candidateEmails = [
    signUp?.emailAddress,
    signUp?.identifier,
    signUp?.emailAddressData?.emailAddress,
    signUp?.emailAddressData?.verification?.identifier,
    signUp?.unsafeMetadata?.emailAddress
  ];

  const signUpEmail = candidateEmails
    .map((value) => String(value ?? "").trim().toLowerCase())
    .find((value) => Boolean(value));

  if (!signUpEmail) {
    // Reuse any pending sign-up attempt if we cannot resolve email fields reliably.
    return String(signUp?.status ?? "").trim().toLowerCase() !== "complete";
  }

  return signUpEmail === normalizedEmail;
}

function resolveBackendRole(internalRole: string | undefined): BackendInternalRole {
  return String(internalRole ?? "").trim().toUpperCase() === "ADMIN" ? "admin" : "client";
}

async function getClerkInstance(): Promise<any | null> {
  if (!isClerkConfigured() || typeof window === "undefined") {
    return null;
  }

  if (!clerkInstancePromise) {
    clerkInstancePromise = (async () => {
      const key = readPublishableKey();
      const module = await import("@clerk/clerk-js");
      const ClerkCtor = (module as any).Clerk;
      const clerk = new ClerkCtor(key);
      await clerk.load();
      return clerk;
    })();
  }

  return (await clerkInstancePromise) as any;
}

function normalizeIdentityFromClerk(clerk: any): ClerkIdentitySnapshot | null {
  const user = clerk?.user;
  const userId = user?.id;
  const primaryEmail = user?.primaryEmailAddress?.emailAddress;

  if (!userId || !primaryEmail) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || undefined;

  return {
    userId,
    email: String(primaryEmail).trim().toLowerCase(),
    fullName
  };
}

export async function getActiveClerkIdentity(): Promise<ClerkIdentitySnapshot | null> {
  const clerk = await getClerkInstance();
  if (!clerk) {
    return null;
  }

  const identity = normalizeIdentityFromClerk(clerk);
  if (!identity) {
    return null;
  }

  const token = await clerk.session?.getToken();
  return {
    ...identity,
    sessionToken: typeof token === "string" && token.length > 0 ? token : undefined
  };
}

export async function subscribeToClerkSessionChanges(
  onIdentity: (identity: ClerkIdentitySnapshot | null) => void
): Promise<() => void> {
  const clerk = await getClerkInstance();
  if (!clerk) {
    return () => {};
  }

  const emitIdentity = async () => {
    const identity = normalizeIdentityFromClerk(clerk);
    if (!identity) {
      onIdentity(null);
      return;
    }

    const token = await clerk.session?.getToken();
    onIdentity({
      ...identity,
      sessionToken: typeof token === "string" && token.length > 0 ? token : undefined
    });
  };

  await emitIdentity();

  if (typeof clerk.addListener !== "function") {
    return () => {};
  }

  const maybeUnsubscribe = clerk.addListener(() => {
    void emitIdentity();
  });

  return () => {
    if (typeof maybeUnsubscribe === "function") {
      maybeUnsubscribe();
    }
  };
}

export async function resolveBackendSessionRole(
  identity: ClerkIdentitySnapshot
): Promise<{ ok: true; role: BackendInternalRole; session: AuthSessionResponse } | { ok: false; role: "client"; status?: number; error: string }> {
  const sessionToken = identity.sessionToken?.trim();
  if (!sessionToken) {
    return {
      ok: false,
      role: "client",
      error: "Sessao Clerk sem token de autenticacao."
    };
  }

  try {
    const response = await fetch(`${resolveApiV1BaseUrl()}/auth/session`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
        "X-Clerk-User-Id": identity.userId,
        "X-Clerk-Email": identity.email
      }
    });

    const rawBody = await response.text();
    const payload = parseJsonSafely(rawBody) as ApiSuccessEnvelope<AuthSessionResponse> | undefined;

    if (response.ok && payload && typeof payload === "object" && payload.data) {
      return {
        ok: true,
        role: resolveBackendRole(payload.data.internalRole),
        session: payload.data
      };
    }

    const errorMessage = response.status === 401 || response.status === 403
      ? "Backend nao autorizou a sessao Clerk."
      : "Nao foi possivel sincronizar a sessao no backend.";

    return {
      ok: false,
      role: "client",
      status: response.status,
      error: errorMessage
    };
  } catch (error) {
    return {
      ok: false,
      role: "client",
      error: error instanceof Error ? error.message : "Falha ao consultar a sessao no backend."
    };
  }
}

export async function beginEmailCodeLogin(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clerk = await getClerkInstance();
  if (!clerk) {
    return { ok: false, error: "Clerk nao configurado no frontend." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false, error: "Informe um email valido." };
  }

  try {
    await clerk.client.signIn.create({
      identifier: normalizedEmail
    });

    await clerk.client.signIn.prepareFirstFactor({
      strategy: "email_code",
      emailAddressId: clerk.client.signIn.supportedFirstFactors?.find((factor: any) => factor.strategy === "email_code")?.emailAddressId
    });

    return { ok: true };
  } catch (error) {
    const message = resolveClerkErrorMessage(error, "Nao foi possivel enviar o codigo OTP.");
    return { ok: false, error: message };
  }
}

export async function beginEmailCodeSignUp(
  firstName: string,
  lastName: string,
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const clerk = await getClerkInstance();
  if (!clerk) {
    return { ok: false, error: "Clerk nao configurado no frontend." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFirstName = firstName.trim();
  const normalizedLastName = lastName.trim();
  if (!normalizedFirstName || !normalizedLastName) {
    return { ok: false, error: "Informe nome e sobrenome." };
  }
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false, error: "Informe um email valido." };
  }

  try {
    const existingSignUp = clerk.client.signUp;
    const signUp = isReusableSignUpAttempt(existingSignUp, normalizedEmail)
      ? existingSignUp
      : await clerk.client.signUp.create({
        emailAddress: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName
      });

    if (signUp?.status === "complete" && signUp.createdSessionId) {
      await clerk.setActive({ session: signUp.createdSessionId });
      return { ok: true };
    }

    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    return { ok: true };
  } catch (error) {
    if (isCaptchaRelatedError(error)) {
      return { ok: false, error: `Conclua o captcha e tente novamente.${resolveClerkErrorDebugDetails(error)}` };
    }

    const message = resolveClerkErrorMessage(error, "Nao foi possivel iniciar o cadastro.");
    return { ok: false, error: `${message}${resolveClerkErrorDebugDetails(error)}` };
  }
}

export async function verifyEmailCodeSignUp(
  code: string
): Promise<{ ok: true; identity: ClerkIdentitySnapshot } | { ok: false; error: string }> {
  const clerk = await getClerkInstance();
  if (!clerk) {
    return { ok: false, error: "Clerk nao configurado no frontend." };
  }

  const normalizedCode = code.trim();
  if (normalizedCode.length < 4) {
    return { ok: false, error: "Informe o codigo OTP recebido por email." };
  }

  try {
    const currentSignUp = clerk.client.signUp;
    if (!currentSignUp || !currentSignUp.id) {
      return { ok: false, error: "Inicie o cadastro antes de validar o codigo." };
    }

    const result = await currentSignUp.attemptEmailAddressVerification({
      code: normalizedCode
    });

    if (result?.status !== "complete" || !result.createdSessionId) {
      return { ok: false, error: "Codigo invalido ou expirado." };
    }

    await clerk.setActive({ session: result.createdSessionId });

    const identity = await getActiveClerkIdentity();
    if (!identity) {
      return { ok: false, error: "Sessao Clerk nao encontrada apos cadastro." };
    }

    return { ok: true, identity };
  } catch (error) {
    const message = resolveClerkErrorMessage(error, "Nao foi possivel validar o cadastro.");
    return { ok: false, error: `${message}${resolveClerkErrorDebugDetails(error)}` };
  }
}

export async function verifyEmailCodeLogin(code: string): Promise<{ ok: true; identity: ClerkIdentitySnapshot } | { ok: false; error: string }> {
  const clerk = await getClerkInstance();
  if (!clerk) {
    return { ok: false, error: "Clerk nao configurado no frontend." };
  }

  const normalizedCode = code.trim();
  if (normalizedCode.length < 4) {
    return { ok: false, error: "Informe o codigo OTP recebido por email." };
  }

  try {
    const result = await clerk.client.signIn.attemptFirstFactor({
      strategy: "email_code",
      code: normalizedCode
    });

    if (result?.status !== "complete" || !result.createdSessionId) {
      return { ok: false, error: "Codigo invalido ou expirado." };
    }

    await clerk.setActive({ session: result.createdSessionId });

    const identity = await getActiveClerkIdentity();
    if (!identity) {
      return { ok: false, error: "Sessao Clerk nao encontrada apos validacao." };
    }

    return { ok: true, identity };
  } catch (error) {
    const message = resolveClerkErrorMessage(error, "Nao foi possivel validar o OTP.");
    return { ok: false, error: message };
  }
}

function resolveOAuthStrategy(provider: ClerkOAuthProvider): string {
  if (provider === "google") {
    return "oauth_google";
  }
  return "oauth_apple";
}

export async function loginWithOAuth(provider: ClerkOAuthProvider): Promise<{ ok: true; redirected: true } | { ok: false; error: string }> {
  const clerk = await getClerkInstance();
  if (!clerk) {
    return { ok: false, error: "Clerk nao configurado no frontend." };
  }

  if (typeof window === "undefined") {
    return { ok: false, error: "OAuth disponivel apenas no navegador." };
  }

  try {
    await clerk.authenticateWithRedirect({
      strategy: resolveOAuthStrategy(provider),
      redirectUrl: window.location.href,
      redirectUrlComplete: window.location.href
    });

    return { ok: true, redirected: true };
  } catch (error) {
    const message = resolveClerkErrorMessage(error, "Nao foi possivel iniciar login social.");
    return { ok: false, error: message };
  }
}

export async function signOutClerk(): Promise<void> {
  const clerk = await getClerkInstance();
  if (!clerk) {
    return;
  }

  if (clerk.user) {
    await clerk.signOut();
  }
}

export const resolveBackendAdminSessionRole = resolveBackendSessionRole;
