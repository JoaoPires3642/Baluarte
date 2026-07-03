// Client-side fetch wrapper that handles expired sessions globally.
// On a 401 (session expired/missing) it redirects the user to /sign-in
// instead of letting the request fail and break the UI (e.g. React hydration errors).

let isRedirecting = false

export function redirectToSignIn(): void {
  if (typeof window === "undefined") return
  if (isRedirecting) return
  // Never redirect to /sign-in from auth flows or the sign-in/up pages themselves (avoids loops).
  const path = window.location.pathname
  if (path === "/sign-in" || path.startsWith("/sign-in/") || path === "/sign-up" || path.startsWith("/sign-up/") || path.startsWith("/api/auth")) {
    return
  }
  isRedirecting = true
  const returnUrl = encodeURIComponent(path + window.location.search)
  window.location.href = `/sign-in?redirect_url=${returnUrl}&error=SessionExpired`
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init)
  if (response.status === 401 && typeof window !== "undefined") {
    redirectToSignIn()
    // Halt downstream processing while the browser navigates to /sign-in.
    return new Promise<Response>(() => {})
  }
  return response
}
