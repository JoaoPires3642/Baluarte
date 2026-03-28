import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { getProductsByTeam, getTeamById } from "@/lib/data";

interface TeamPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: TeamPageProps) {
  const { id } = await params;
  const team = getTeamById(id);

  if (!team) {
    return { title: "Time não encontrado | Baluarte" };
  }

  return {
    title: `${team.name} | Baluarte`,
    description: `Coleção oficial de camisas do ${team.name}.`,
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const team = getTeamById(id);

  if (!team) {
    notFound();
  }

  const teamProducts = getProductsByTeam(team.id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Time</p>
            <h1 className="mt-2 text-3xl font-black text-foreground md:text-4xl">{team.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {team.league ? `${team.league} • ` : ""}Produtos oficiais disponíveis
            </p>
            <div className="mt-4">
              <Link href={`/categoria/${team.category}`}>
                <Button variant="outline" size="sm">
                  Ver categoria
                </Button>
              </Link>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-foreground">Produtos do time</h2>
            {teamProducts.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Nenhum produto disponível no momento.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {teamProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
