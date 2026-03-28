import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts } from "@/lib/data";

const featuredProducts = getFeaturedProducts();

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-background">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,color-mix(in_oklab,var(--primary)_8%,transparent)_40%,transparent_75%)]" />
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row">
              {/* Hero Content */}
              <div className="flex flex-col justify-center px-4 py-12 md:py-20 lg:w-1/2 lg:pr-8">
                <span className="mb-3 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold tracking-[0.2em] text-primary uppercase">
                  Colecao 2024
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase leading-none">
                  Vista a camisa
                  <br />
                  <span className="text-primary">do seu time</span>
                </h1>
                <p className="mt-4 max-w-md text-base text-muted-foreground md:text-lg">
                  Camisas oficiais dos maiores times do mundo. Qualidade premium, entrega rapida.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/categoria/nacionais">
                    <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-sm">
                      Comprar Agora
                    </Button>
                  </Link>
                  <Link href="/categoria/selecoes">
                    <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold border-foreground/20 text-foreground hover:border-primary hover:text-primary">
                      Ver Selecoes
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative lg:w-1/2 aspect-square lg:aspect-auto min-h-[300px] lg:min-h-[500px]">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-foreground/30 via-transparent to-transparent lg:hidden" />
                <Image
                  src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80"
                  alt="Camisa de futebol"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Category Cards */}
        <section className="px-4 py-8 md:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Nacionais", slug: "nacionais", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=80" },
                { name: "Internacionais", slug: "internacionais", image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&q=80" },
                { name: "Selecoes", slug: "selecoes", image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80" },
              ].map((cat) => (
                <Link 
                  key={cat.slug} 
                  href={`/categoria/${cat.slug}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary"
                >
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl md:text-2xl font-bold text-background uppercase tracking-tight">
                      {cat.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-2 group-hover:underline">
                      Ver Colecao <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="bg-secondary/60 px-4 py-8 md:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                  Em destaque
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground uppercase tracking-tight">
                  Mais Vendidos
                </h2>
              </div>
              <Link href="/categoria/nacionais" className="text-sm font-semibold text-primary hover:underline hidden md:block">
                Ver Todos
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-6 text-center md:hidden">
              <Link href="/categoria/nacionais">
                <Button variant="outline" className="border-foreground/20 text-foreground hover:border-primary hover:text-primary">
                  Ver Todos os Produtos
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
