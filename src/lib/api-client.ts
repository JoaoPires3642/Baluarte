// Client-side fetch wrapper that handles expired sessions globally.
// On a 401 (session expired/missing) it redirects the user to /sign-in
// instead of letting the request fail and break the UI (e.g. React hydration errors).

let isRedirecting = false

export function redirectToSignIn(): void {
  if (typeof window === "undefined") return
  if (isRedirecting) return
  isRedirecting = true
  const callbackUrl = encodeURIComponent(
    window.location.pathname + window.location.search,
  )
  window.location.href = `/sign-in?callbackUrl=${callbackUrl}&error=SessionExpired`
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
