import { fetchApi } from "./client"
import type { SiteContactSettings } from "./types"

export async function fetchSiteContactSettings() {
  // Cacheable (ISR) so static pages (footer is a server component rendered on every
  // route) can be statically generated. `cache: "no-store"` would force dynamic
  // rendering and break SSG with a dynamic-server-error at build time.
  return fetchApi<{ data: SiteContactSettings }>("/site/contact-settings", {
    next: { revalidate: 60 },
    maxAttempts: 1,
  })
}
