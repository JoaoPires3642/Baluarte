import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { ChevronRight, Globe2, ShieldCheck, Shirt, Sparkles, Trophy, Truck } from "lucide-react"
import { fetchCategories, fetchPublicModels, type Category, type Model } from "@/lib/api"
import { resolveServerAuthSession } from "@/lib/auth"
import { homeCategoryMap } from "@/lib/home-categories"
import { resolveMediaUrl } from "@/lib/media"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type DisplayModel = Model & {
  image?: string
  name?: string
  team?: { name?: string }
}

async function getData() {
  try {
    const [categoriesRes, modelsRes] = await Promise.all([
      fetchCategories(),
      fetchPublicModels(),
    ])
    return {
      categories: categoriesRes.data,
      products: modelsRes.data,
    }
  } catch {
    return { categories: [], products: [] }
  }
}

export default async function Home() {
  const authSession = await resolveServerAuthSession()

  if (authSession.isAdmin) {
    redirect("/admin")
  }

  const { categories, products } = await getData()

  const displayCategories = categories.map((category: Category) => {
    const normalizedSlug = String(category.slug).toLowerCase()
    const visual = homeCategoryMap[
      normalizedSlug === "estrangeiros"
        ? "internacionais"
        : normalizedSlug === "treino"
          ? "personalizado"
          : normalizedSlug
    ]

    return {
      ...category,
      image: visual?.image,
      color: visual?.color,
    }
  })

  const displayProducts = products
  const categoryIcons = [Trophy, Globe2, Sparkles, Shirt]

  return (
    <div className="space-y-14 py-6 md:space-y-20 md:py-10">
      <section className="section-shell">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[#d9e2ef] bg-slate-950 shadow-2xl shadow-slate-900/15 md:rounded-[2.5rem]">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#07162f]/96 via-[#0f274d]/88 to-[#7a1521]/78" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80')" }}
        />
        <div className="relative z-20 flex min-h-[340px] items-center sm:min-h-[380px] md:min-h-[560px]">
          <div className="w-full px-5 py-8 sm:px-6 sm:py-8 md:px-10 md:py-14">
            <div className="max-w-3xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.24em] text-white backdrop-blur-sm sm:mb-5 sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.28em]">
                <ShieldCheck className="h-4 w-4" /> Curadoria Baluarte
              </span>
              <h1 className="max-w-2xl text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.05em] text-white sm:text-4xl md:text-7xl">
                Baluarte
                <span className="block text-[#ffd7d9]">artigos esportivos</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/84 sm:text-base sm:leading-7 md:mt-5 md:text-lg">
                Uma vitrine premium para camisas, coleções e peças esportivas com visual profissional, compra simples e identidade forte em branco, azul escuro e vermelho.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <Button size="lg" className="w-full bg-white px-6 text-[#0f274d] hover:bg-slate-100 sm:w-auto sm:px-8" asChild>
                  <Link href="#categorias">Ver categorias</Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full border-white/60 bg-transparent px-6 text-white hover:border-white hover:bg-white hover:text-[#0f274d] sm:w-auto sm:px-8" asChild>
                  <Link href="/busca">Explorar catálogo</Link>
                </Button>
              </div>
              <div className="mt-7 grid grid-cols-1 gap-3 text-white/88 sm:mt-8 sm:grid-cols-3 sm:gap-6 md:mt-10">
                <div>
                  <p className="text-xl font-extrabold sm:text-2xl">+12 mil</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/65">Clientes atendidos</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold sm:text-2xl">24h</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/65">Envio prioritário</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold sm:text-2xl">Premium</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/65">Curadoria oficial</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categorias" className="section-shell">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Explore</p>
            <h2 className="mt-3 text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900">Categorias</h2>
          </div>
          <Link href="/busca" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#0f274d] hover:underline">
            Ver catálogo <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayCategories.map((category, index: number) => {
            const Icon = categoryIcons[index % categoryIcons.length]

            return (
            <Link key={category.slug} href={`/categorias/${category.slug}`}>
              <Card className="group relative min-h-[240px] cursor-pointer overflow-hidden border-0 bg-slate-950 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/15">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${category.image || homeCategoryMap[category.slug]?.image || ""}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
                <div className="absolute left-0 top-0 h-1.5 w-full" style={{ backgroundColor: category.color || homeCategoryMap[category.slug]?.color || "#475569" }} />
                <CardContent className="relative flex min-h-[220px] flex-col justify-end p-5">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm"><Icon className="h-7 w-7" /></span>
                  <div>
                    <h3 className="text-2xl font-bold uppercase tracking-[-0.03em] text-white transition-colors">
                      {category.name}
                    </h3>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">Ver coleção →</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )})}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-shell">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Em destaque</p>
            <h2 className="mt-3 text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900">Mais vendidos</h2>
            <p className="mt-2 text-slate-500">Os produtos mais procurados pelos torcedores</p>
          </div>
          <Link href="/busca" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#0f274d] hover:underline">
            Ver todos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {displayProducts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {displayProducts.slice(0, 4).map((product: DisplayModel) => {
            const mediaUrl = resolveMediaUrl(product.thumbnailUrl || product.imageUrl || product.image)

            return (
            <Link key={product.id} href={`/produto/${product.id}?team=${encodeURIComponent(product.teamSlug || "")}`}>
              <Card className="group cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10">
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  {mediaUrl ? (
                    <Image 
                      src={mediaUrl} 
                      alt={product.modelName} 
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#0f274d]">
                      <Shirt className="h-14 w-14" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-[#c3222a] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white shadow-lg shadow-red-950/20">
                    Seleção
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{product.teamSlug}</p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-bold uppercase tracking-[-0.03em] text-slate-900 transition-colors group-hover:text-[#0f274d]">
                    {product.modelName || product.name}
                  </h3>
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                    <span className="text-2xl font-extrabold text-[#102a5c]">
                      R$ {Number(product.price).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )})}
        </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhum produto em destaque disponivel no momento.</p>
        )}
      </section>

      {/* Banner Promotional */}
      <section className="section-shell">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-0 bg-[#0f274d] p-1 text-white lg:col-span-2">
            <CardContent className="rounded-[1.3rem] bg-gradient-to-r from-[#0b1f3f] to-[#15325f] p-8 md:p-12">
              <p className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#ffd7d9]"><Truck className="h-4 w-4" /> Benefícios Baluarte</p>
              <h2 className="mb-3 mt-3 text-3xl font-extrabold uppercase tracking-[-0.04em] text-white md:text-4xl">
                Experiência de compra mais forte, limpa e profissional
              </h2>
              <p className="mx-auto mb-6 max-w-2xl text-white/80">
                Fundo branco, contraste em azul escuro e detalhes vermelhos criam uma loja mais confiável, premium e direta para conversão.
              </p>
              <Button className="bg-white px-8 text-[#0f274d] hover:bg-slate-100" asChild>
                <Link href="/contato">Falar com a equipe</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#f1d4d6] bg-[#fff6f6]">
            <CardContent className="flex h-full flex-col justify-between p-6 sm:p-8">
              <div>
                <p className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#c3222a]"><Sparkles className="h-4 w-4" /> Destaque</p>
                <h3 className="mt-3 text-2xl font-extrabold uppercase tracking-[-0.04em] text-[#10233f]">Frete grátis acima de R$ 299</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">Condição ideal para elevar ticket médio sem poluir o layout.</p>
              </div>
              <Button variant="destructive" className="mt-6" asChild>
                <Link href="/checkout">Aproveitar oferta</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="section-shell">
        <div className="rounded-[2rem] border border-[#f1d4d6] bg-[#fff7f7] p-8 text-center md:p-12">
          <p className="eyebrow">Comunidade</p>
          <h2 className="mb-3 mt-3 text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900">
            Receba ofertas exclusivas
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-slate-600">
            Cadastro simples, visual mais premium e comunicação alinhada com a identidade da Baluarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Seu melhor email"
              className="h-12 flex-1 rounded-full border border-[#d9e2ef] bg-white px-5 outline-none focus:border-[#0f274d] focus:ring-2 focus:ring-[#0f274d]/20"
            />
            <Button variant="destructive" className="h-12 px-8">
              Cadastrar
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
