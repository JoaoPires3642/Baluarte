import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TeamCard } from "@/components/team-card";
import { CategoryTabs } from "@/components/category-tabs";
import { getTeamsByCategory } from "@/lib/data";
import { Category } from "@/lib/types";

const categoryNames: Record<string, string> = {
  nacionais: "Times Nacionais",
  internacionais: "Times Internacionais",
  selecoes: "Seleções",
};

const categoryDescriptions: Record<string, string> = {
  nacionais: "Os maiores times do futebol brasileiro",
  internacionais: "Os gigantes do futebol mundial",
  selecoes: "As maiores seleções do planeta",
};

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const title = categoryNames[slug] || "Categoria";
  return {
    title: `${title} | Baluarte`,
    description: categoryDescriptions[slug] || "Camisas de times de futebol",
  };
}

export default async function CategoryBySlugPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  if (!["nacionais", "internacionais", "selecoes"].includes(slug)) {
    notFound();
  }

  const teams = getTeamsByCategory(slug as Category);
  const categoryName = categoryNames[slug];
  const categoryDescription = categoryDescriptions[slug];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <CategoryTabs />

          <div className="mt-8">
            <h1 className="text-3xl font-bold text-foreground">{categoryName}</h1>
            <p className="mt-2 text-muted-foreground">{categoryDescription}</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>

          {teams.length === 0 && (
            <div className="mt-12 text-center">
              <p className="text-muted-foreground">Nenhum time encontrado nesta categoria.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
