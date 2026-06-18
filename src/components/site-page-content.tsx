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
    const res = await fetch(`${API_BASE_URL}/site/pages/${slug}`, {
      cache: "no-store",
    })
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
