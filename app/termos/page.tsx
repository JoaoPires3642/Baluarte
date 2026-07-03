import { SitePageContent } from "@/components/site-page-content"

// Force dynamic (SSR) so Next does not fetch the backend page at build time.
// The backend can be unreachable from the Vercel build environment, which made
// static generation hang >60s and fail the build. Real content is fetched at
// request time with a short timeout (see SitePageContent).
export const dynamic = "force-dynamic"

const SLUG = "termos"
const FALLBACK_TITLE = "Termos de Uso"
const FALLBACK_CONTENT = "Conteudo indispotravel no momento. Tente novamente mais tarde."

export default function TermosPage() {
  return (
    <SitePageContent
      slug={SLUG}
      fallbackTitle={FALLBACK_TITLE}
      fallbackContent={FALLBACK_CONTENT}
    />
  )
}
