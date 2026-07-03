import { fetchApi } from "./client"
import type { SiteContactSettings } from "./types"

export async function fetchSiteContactSettings() {
  return fetchApi<{ data: SiteContactSettings }>("/site/contact-settings", {
    cache: "no-store",
    maxAttempts: 1,
  })
}
