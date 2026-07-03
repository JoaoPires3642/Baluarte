import { SitePageContent } from "@/components/site-page-content"

export const dynamic = "force-dynamic"

const SLUG = "privacidade"
const FALLBACK_TITLE = "Politica de Privacidade"
const FALLBACK_CONTENT = "Conteudo indispotravel no momento. Tente novamente mais tarde."

export default function PrivacidadePage() {
  return (
    <SitePageContent
      slug={SLUG}
      fallbackTitle={FALLBACK_TITLE}
      fallbackContent={FALLBACK_CONTENT}
    />
  )
}
