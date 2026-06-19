export const dynamic = "force-dynamic"
export const revalidate = 0

import { notFound } from "next/navigation"
import { fetchModelDetail, fetchProductById, type ModelDetail } from "@/lib/api"
import { ProductPageView } from "@/components/product-page-view"

type ProductPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ team?: string }>
}

async function getProduct(id: string, teamSlug?: string): Promise<ModelDetail | null> {
  const attempts: Array<() => Promise<{ data: ModelDetail | null } | null>> = []

  if (teamSlug) {
    attempts.push(() => fetchModelDetail(teamSlug, id).catch(() => null))
  }
  attempts.push(() => fetchProductById(id).catch(() => null))

  for (const attempt of attempts) {
    try {
      const res = await attempt()
      if (res?.data) {
        return res.data
      }
    } catch (err) {
      console.error("[produto] erro ao buscar produto", { id, teamSlug, message: err instanceof Error ? err.message : String(err) })
    }
  }

  console.warn("[produto] produto nao encontrado", { id, teamSlug })
  return null
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params
  const { team } = await searchParams
  const product = await getProduct(id, team)

  if (!product) {
    notFound()
  }

  return <ProductPageView product={product} />
}
