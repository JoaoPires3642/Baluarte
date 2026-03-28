import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ShippingCalculator } from "@/components/shipping-calculator";
import { ProductActions } from "../product-actions";
import { getProductById } from "@/lib/data";
import { Shield, Truck, RotateCcw } from "lucide-react";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) {
    return { title: "Produto não encontrado | Baluarte" };
  }
  return {
    title: `${product.name} | Baluarte`,
    description: product.description,
  };
}

export default async function ProductByIdPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0;
  const galleryImages = product.images && product.images.length > 0 ? product.images : [product.image];

  const categoryNames: Record<string, string> = {
    nacionais: "Nacionais",
    internacionais: "Internacionais",
    selecoes: "Seleções",
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Início
            </Link>
            <span>/</span>
            <Link href={`/categoria/${product.team.category}`} className="hover:text-foreground">
              {categoryNames[product.team.category]}
            </Link>
            <span>/</span>
            <Link href={`/time/${product.team.id}`} className="hover:text-foreground">
              {product.team.name}
            </Link>
            <span>/</span>
            <span className="line-clamp-1 text-foreground">{product.name}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
              <Image src={galleryImages[0]} alt={product.name} fill className="object-cover" priority />
              {hasDiscount && (
                <div className="absolute left-4 top-4 rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                  -{discountPercentage}%
                </div>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {galleryImages.slice(1, 5).map((image, index) => (
                  <div key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-md border border-border bg-secondary">
                    <Image src={image} alt={`${product.name} imagem ${index + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col">
              <Link href={`/time/${product.team.id}`} className="text-sm text-primary hover:underline">
                {product.team.name}
              </Link>

              <h1 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">{product.name}</h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    R$ {product.originalPrice!.toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Em até 12x de R$ {(product.price / 12).toFixed(2).replace(".", ",")} sem juros
              </p>

              <p className="mt-6 text-muted-foreground">{product.description}</p>

              <ProductActions product={product} />

              <div className="mt-6">
                <ShippingCalculator />
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Produto 100% original e licenciado</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Truck className="h-5 w-5 text-primary" />
                  <span>Frete grátis para compras acima de R$ 299</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <RotateCcw className="h-5 w-5 text-primary" />
                  <span>Troca grátis em até 30 dias</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
