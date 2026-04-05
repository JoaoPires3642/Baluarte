import { DEFAULT_API_TIMEOUT_MS, resolveApiV1BaseUrl } from "../env";
import { normalizeApiError } from "./errors";
import { resolveInternalRoleFromClerkIdentity } from "./contracts";
import type { ApiRequestOptions, ApiSuccessEnvelope, NormalizedApiError } from "./contracts";

function readAdminEmailAllowlistFromEnv(): string[] {
  const raw = process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((value: string) => value.trim())
    .filter((value: string) => value.length > 0);
}

const ADMIN_EMAIL_ALLOWLIST = readAdminEmailAllowlistFromEnv();
const ADMIN_BYPASS_KEY = process.env.EXPO_PUBLIC_ADMIN_BYPASS_KEY?.trim() || "";

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

export class ApiClient {
  constructor(private readonly apiV1BaseUrl: string = resolveApiV1BaseUrl()) {}

  async request<TData>(path: string, options: ApiRequestOptions = {}): Promise<ApiSuccessEnvelope<TData>> {
    if ((process.env.NODE_ENV ?? "").toLowerCase() !== "production") {
      const method = options.method ?? "GET";
      console.info(`[api] ${method} ${this.apiV1BaseUrl}${path}`);
    }

    if (isLikelyReactNativeRuntime() && isUnreachableLocalhostBaseUrl(this.apiV1BaseUrl)) {
      throw normalizeApiError({
        code: "API_BASE_URL_NOT_CONFIGURED",
        message:
          "Configure EXPO_PUBLIC_API_BASE_URL com o IP da sua maquina na rede local (ex: http://192.168.0.10:8080)."
      });
    }

    const timeoutMs = options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.apiV1BaseUrl}${path}`, {
        method: options.method ?? "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(options.authorizationContext
            ? {
                "X-Clerk-User-Id": options.authorizationContext.clerkIdentity.clerkUserId,
                "X-Clerk-Email": options.authorizationContext.clerkIdentity.email,
                "X-Internal-Role":
                  options.authorizationContext.internalRole ??
                  resolveInternalRoleFromClerkIdentity(
                    options.authorizationContext.clerkIdentity,
                    ADMIN_EMAIL_ALLOWLIST
                  ),
                ...(ADMIN_BYPASS_KEY
                  ? {
                      "X-Admin-Bypass-Key": ADMIN_BYPASS_KEY
                    }
                  : {})
              }
            : {}),
          ...(options.headers || {})
        },
        body: options.body,
        signal: controller.signal
      });

      const rawBody = await response.text();
      const payload = parseJsonSafely(rawBody);
      const traceIdHeader = response.headers.get("x-trace-id") ?? undefined;

      if (!response.ok) {
        throw normalizeApiError({
          status: response.status,
          payload,
          fallbackTraceId: traceIdHeader
        });
      }

      if (!payload || typeof payload !== "object" || !("data" in payload)) {
        throw normalizeApiError({
          status: response.status,
          payload: undefined,
          fallbackTraceId: traceIdHeader,
          message: "Resposta invalida da API."
        });
      }

      return payload as ApiSuccessEnvelope<TData>;
    } catch (error) {
      if (isNormalizedApiError(error)) {
        throw error;
      }

      if (isAbortLikeError(error)) {
        throw normalizeApiError({
          message: "Tempo limite excedido ao chamar a API."
        });
      }

      throw normalizeApiError({
        message: error instanceof Error ? error.message : undefined
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function isNormalizedApiError(value: unknown): value is NormalizedApiError {
  return Boolean(
    value &&
      typeof value === "object" &&
      "code" in value &&
      "message" in value &&
      typeof (value as Record<string, unknown>).code === "string" &&
      typeof (value as Record<string, unknown>).message === "string"
  );
}

function isAbortLikeError(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  const errorName = typeof record.name === "string" ? record.name.toLowerCase() : "";
  const errorCode = typeof record.code === "string" ? record.code.toLowerCase() : "";
  const errorMessage = typeof record.message === "string" ? record.message.toLowerCase() : "";

  return (
    errorName.includes("abort") ||
    errorCode.includes("abort") ||
    errorMessage.includes("aborted") ||
    errorMessage.includes("timeout")
  );
}

function isLikelyReactNativeRuntime(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return navigator.product === "ReactNative";
}

function isUnreachableLocalhostBaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
