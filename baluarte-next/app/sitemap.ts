import { MetadataRoute } from "next"
import { fetchCategories, fetchPublicModels, type Category, type Model } from "@/lib/api"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://baluarte.com.br"

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/categorias`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/times`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/carrinho`, lastModified: new Date(), priority: 0.6 },
  ]

  try {
    const [categoriesRes, modelsRes] = await Promise.all([
      fetchCategories(),
      fetchPublicModels(),
    ])

    const categoryUrls = categoriesRes.data.map((cat: Category) => ({
      url: `${baseUrl}/categorias/${cat.slug}`,
      lastModified: new Date(),
      priority: 0.7,
    }))

    const productUrls = modelsRes.data.map((model: Model) => ({
      url: `${baseUrl}/produto/${model.id}`,
      lastModified: new Date(),
      priority: 0.6,
    }))

    return [...staticPages, ...categoryUrls, ...productUrls]
  } catch {
    return staticPages
  }
}
