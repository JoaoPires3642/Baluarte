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
  authorizationContext?: ApiAuthorizationContext;
}

export type InternalUserRole = "admin" | "client";

export interface ClerkIdentityDto {
  clerkUserId: string;
  email: string;
}

export interface ApiAuthorizationContext {
  clerkIdentity: ClerkIdentityDto;
  internalRole?: InternalUserRole;
}

export function resolveInternalRoleFromClerkIdentity(
  identity: ClerkIdentityDto,
  adminEmailAllowlist: string[] = []
): InternalUserRole {
  const normalizedEmail = identity.email.trim().toLowerCase();
  const normalizedAllowlist = new Set(adminEmailAllowlist.map((email) => email.trim().toLowerCase()));
  return normalizedAllowlist.has(normalizedEmail) ? "admin" : "client";
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface TeamDto {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  categorySlug: string;
  league?: string;
  displayOrder: number;
}

export interface CatalogModelDto {
  id: string;
  name: string;
  slug: string;
  teamSlug: string;
  imageUrl: string;
  displayOrder: number;
}
