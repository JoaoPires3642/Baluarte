import { fetchApi } from "./client"
import type { AuthSession } from "./types"

// Auth Session - GET /auth/session
export async function fetchAuthSession() {
  return fetchApi<{ data: AuthSession }>("/auth/session")
}
