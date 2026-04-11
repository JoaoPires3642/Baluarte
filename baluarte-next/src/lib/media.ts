const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ""
  }
}

export function resolveMediaUrl(value?: string | null) {
  if (!value) {
    return null
  }

  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) {
    return value
  }

  const apiOrigin = getApiOrigin()
  if (!apiOrigin) {
    return value
  }

  const normalizedPath = value.startsWith("/") ? value : `/${value}`
  return `${apiOrigin}${normalizedPath}`
}
