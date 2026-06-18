import { SitePageContent } from "@/components/site-page-content"

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
