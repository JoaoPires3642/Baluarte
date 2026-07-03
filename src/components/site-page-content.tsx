const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

type SitePagePublicResponse = {
  data: {
    title: string
    content: string
  }
}

export async function SitePageContent({
  slug,
  fallbackTitle,
  fallbackContent,
}: {
  slug: string
  fallbackTitle: string
  fallbackContent: string
}) {
  let title = fallbackTitle
  let content = fallbackContent

  try {
    // Short timeout so static generation (SSG) at build time can't hang for >60s
    // and fail the build when the backend is unreachable from the build environment.
    // On failure we fall back to the hardcoded content; ISR (revalidate: 60) will
    // refresh with real content at runtime when the backend is reachable.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${API_BASE_URL}/site/pages/${slug}`, {
      next: { revalidate: 60 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (res.ok) {
      const payload = await res.json() as SitePagePublicResponse
      title = payload.data.title
      content = payload.data.content
    }
  } catch {
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-[#0f274d]">{title}</h1>
      <div
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}
