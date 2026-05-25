import { notFound } from "next/navigation"
import { fetchModelDetail, fetchProductById, type ModelDetail } from "@/lib/api"
import { ProductPageView } from "@/components/product-page-view"

type ProductPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ team?: string }>
}

async function getProduct(id: string, teamSlug?: string): Promise<ModelDetail | null> {
  try {
    if (teamSlug) {
      const res = await fetchModelDetail(teamSlug, id)
      return res.data
    }

    const res = await fetchProductById(id)
    return res.data
  } catch {
    return null
  }
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
