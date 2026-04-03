export interface ApiSuccessEnvelope<TData> {
  data: TData;
  meta?: Record<string, unknown>;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorEnvelope {
  error: ApiErrorPayload;
  traceId?: string;
}

export interface NormalizedApiError {
  code: string;
  message: string;
  details?: unknown;
  status?: number;
  traceId?: string;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
}
