import type { ApiErrorEnvelope, NormalizedApiError } from "./contracts";

export const FALLBACK_ERROR_CODE = "UNEXPECTED_ERROR";
export const FALLBACK_ERROR_MESSAGE = "Nao foi possivel completar a solicitacao.";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asErrorEnvelope(value: unknown): ApiErrorEnvelope | undefined {
  if (!isObject(value) || !isObject(value.error)) {
    return undefined;
  }

  const { error } = value;
  if (typeof error.code !== "string" || typeof error.message !== "string") {
    return undefined;
  }

  return {
    error: {
      code: error.code,
      message: sanitizeBackendMessage(error.message),
      details: error.details
    },
    traceId: typeof value.traceId === "string" ? value.traceId : undefined
  };
}

function sanitizeBackendMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return FALLBACK_ERROR_MESSAGE;
  }

  const looksLikeStackTrace = /exception|trace|\sat\s|\n|\r|stack/i.test(trimmed);
  if (looksLikeStackTrace) {
    return FALLBACK_ERROR_MESSAGE;
  }

  return trimmed;
}

export function normalizeApiError(input: {
  code?: string;
  status?: number;
  payload?: unknown;
  fallbackTraceId?: string;
  message?: string;
}): NormalizedApiError {
  const envelope = asErrorEnvelope(input.payload);

  return {
    status: input.status,
    code: input.code ?? envelope?.error.code ?? FALLBACK_ERROR_CODE,
    message: envelope?.error.message ?? input.message ?? FALLBACK_ERROR_MESSAGE,
    details: envelope?.error.details,
    traceId: envelope?.traceId ?? input.fallbackTraceId
  };
}
