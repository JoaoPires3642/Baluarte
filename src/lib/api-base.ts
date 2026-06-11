const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1"

export function getBrowserSafeApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL

  if (typeof window === "undefined") {
    return process.env.BACKEND_INTERNAL_URL || (apiBaseUrl.startsWith("http") ? apiBaseUrl : DEFAULT_API_BASE_URL)
  }

  if (window.location.protocol === "https:" && apiBaseUrl.startsWith("http://")) {
    return "/api/proxy"
  }

  return apiBaseUrl
}

export function getBrowserSafeUploadUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL

  if (typeof window !== "undefined" && window.location.protocol === "https:" && apiBaseUrl.startsWith("http://")) {
    return "/api/admin/media/upload"
  }

  return `${apiBaseUrl}/admin/media/upload`
}
