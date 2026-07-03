import { SitePageContent } from "@/components/site-page-content"

export const dynamic = "force-dynamic"

const SLUG = "trocas"
const FALLBACK_TITLE = "Politica de Trocas e Devolucoes"
const FALLBACK_CONTENT = "Conteudo indispotravel no momento. Tente novamente mais tarde."

export default function TrocasPage() {
  return (
    <SitePageContent
      slug={SLUG}
      fallbackTitle={FALLBACK_TITLE}
      fallbackContent={FALLBACK_CONTENT}
    />
  )
}
