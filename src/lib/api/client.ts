import { getBrowserSafeApiBaseUrl } from "@/lib/api-base"
import { apiFetch } from "@/lib/api-client"

export const CATALOG_CACHE = { next: { revalidate: 300, tags: ["catalog"] } }

export type ApiRequestInit = RequestInit & {
  next?: {
    revalidate?: number
    tags?: string[]
  }
}

function describeFetchError(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const cause = (err as { cause?: { code?: string; message?: string } }).cause
  if (cause?.code) {
    return `${cause.code}: ${cause.message ?? err.message}`
  }
  return err.message
}

async function fetchWithTimeout(url: string, options?: ApiRequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    return await apiFetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options?: ApiRequestInit & { maxAttempts?: number }
): Promise<T> {
  const baseUrl = getBrowserSafeApiBaseUrl()
  const url = `${baseUrl}${endpoint}`

  let lastError: unknown = null
  const maxAttempts = options?.maxAttempts ?? 3
  // Backoff maior (600ms, 1800ms) para dar tempo do backend/proxy
  // completar handshakes TLS pendentes e evitar ECONNRESET em rajada.
  const backoffMs = [0, 600, 1800]

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (backoffMs[attempt] > 0) {
      await new Promise((r) => setTimeout(r, backoffMs[attempt]))
    }

    let response: Response
    try {
      const hasNextCache = options?.next?.revalidate != null || options?.next?.tags?.length
      response = await fetchWithTimeout(url, {
        ...options,
        cache: hasNextCache ? undefined : "no-store",
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      })
    } catch (err) {
      lastError = err
      if (typeof window === "undefined") {
        console.error("[fetchApi] network error", {
          url,
          endpoint,
          attempt,
          message: describeFetchError(err),
        })
      }
      continue
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const errPayload = body?.error
      const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
      if (typeof window === "undefined") {
        console.error("[fetchApi] non-ok response", {
          url,
          endpoint,
          attempt,
          status: response.status,
          message: errPayload?.message,
        })
      }
      // 4xx sao deterministicas - nao adianta retry
      if (response.status >= 400 && response.status < 500) {
        throw new Error((errPayload?.message || "Erro na requisição") + details)
      }
      lastError = new Error((errPayload?.message || "Erro na requisição") + details)
      continue
    }

    return response.json()
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Erro de conexao com o backend")
}

export async function fetchAdminApi<T>(endpoint: string, options?: ApiRequestInit): Promise<T> {
  const response = await apiFetch(`/api/admin/admin${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const errPayload = body?.error
    const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
    throw new Error((errPayload?.message || "Erro na requisição") + details)
  }

  return response.json()
}
