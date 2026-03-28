"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminCategory, Category, Team } from "@/lib/types";
import { teams as defaultTeams } from "@/lib/data";
import {
  CATEGORY_STORAGE_KEY,
  defaultCategories,
  getCategoryName,
  normalizeCategories,
} from "@/lib/admin-categories";
import { ExternalLink, Pencil, Plus, Search, Trash2, X } from "lucide-react";

const STORAGE_KEY = "admin_teams_v1";

const slugifyTeamId = (value: string): string => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

type TeamFormState = {
  id: string;
  name: string;
  category: Category;
  league: string;
  logo: string;
};

const createDefaultForm = (): TeamFormState => ({
  id: "",
  name: "",
  category: "nacionais",
  league: "",
  logo: "",
});

export default function AdminTeamsPage() {
  const [teamList, setTeamList] = useState<Team[]>(defaultTeams);
  const [categories, setCategories] = useState<AdminCategory[]>(defaultCategories);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productsCountByTeam, setProductsCountByTeam] = useState<Record<string, number>>({});
  const [form, setForm] = useState<TeamFormState>(createDefaultForm());

  useEffect(() => {
    try {
      const savedCategories = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (savedCategories) {
        setCategories(normalizeCategories(JSON.parse(savedCategories)));
      }
    } catch {
      setCategories(defaultCategories);
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Team[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTeamList(parsed);
        }
      }
    } catch {
      setTeamList(defaultTeams);
    }

    try {
      const savedProducts = localStorage.getItem("admin_products_v1");
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts) as Array<{ teamId?: string }>;
        if (Array.isArray(parsedProducts)) {
          const counts = parsedProducts.reduce<Record<string, number>>((acc, product) => {
            if (!product.teamId) return acc;
            acc[product.teamId] = (acc[product.teamId] || 0) + 1;
            return acc;
          }, {});
          setProductsCountByTeam(counts);
        }
      }
    } catch {
      setProductsCountByTeam({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teamList));
  }, [teamList]);

  useEffect(() => {
    if (categoryFilter !== "all" && !categories.some((category) => category.slug === categoryFilter)) {
      setCategoryFilter("all");
    }

    if (categories.length > 0 && !categories.some((category) => category.slug === form.category)) {
      setForm((prev) => ({ ...prev, category: categories[0].slug }));
    }
  }, [categories, categoryFilter, form.category]);

  const filteredTeams = useMemo(() => {
    return teamList.filter((team) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        team.name.toLowerCase().includes(q) ||
        team.id.toLowerCase().includes(q) ||
        (team.league || "").toLowerCase().includes(q);

      const matchesCategory = categoryFilter === "all" || team.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [teamList, search, categoryFilter]);

  const openEditForm = (team: Team) => {
    setEditingId(team.id);
    setForm({
      id: team.id,
      name: team.name,
      category: team.category,
      league: team.league || "",
      logo: team.logo,
    });
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    const firstCategory = categories[0]?.slug ?? "nacionais";
    setEditingId(null);
    setForm({
      id: "",
      name: "",
      category: firstCategory,
      league: "",
      logo: "",
    });
    setIsFormOpen(true);
  };

  const removeTeam = (team: Team) => {
    const linkedProducts = productsCountByTeam[team.id] || 0;
    if (linkedProducts > 0) {
      window.alert(`Nao e possivel remover. Existem ${linkedProducts} produto(s) vinculados a este time.`);
      return;
    }

    if (!window.confirm(`Deseja remover o time ${team.name}?`)) {
      return;
    }

    setTeamList((prev) => prev.filter((item) => item.id !== team.id));
  };

  const saveTeam = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim() || !form.logo.trim()) {
      window.alert("Preencha nome e logo do time.");
      return;
    }

    if (!categories.some((category) => category.slug === form.category)) {
      window.alert("Selecione uma categoria valida.");
      return;
    }

    const normalizedId = slugifyTeamId(form.id || form.name);
    if (!normalizedId) {
      window.alert("Informe um identificador valido para o time.");
      return;
    }

    const idAlreadyExists = teamList.some((team) => team.id === normalizedId && team.id !== editingId);
    if (idAlreadyExists) {
      window.alert("Ja existe um time com esse identificador.");
      return;
    }

    if (!editingId) {
      const nextTeam: Team = {
        id: normalizedId,
        name: form.name.trim(),
        category: form.category,
        league: form.league.trim() || undefined,
        logo: form.logo.trim(),
      };
      setTeamList((prev) => [nextTeam, ...prev]);
      setIsFormOpen(false);
      setEditingId(null);
      setForm(createDefaultForm());
      return;
    }

    setTeamList((prev) =>
      prev.map((team) =>
        team.id === editingId
          ? {
              ...team,
              id: normalizedId,
              name: form.name.trim(),
              category: form.category,
              league: form.league.trim() || undefined,
              logo: form.logo.trim(),
            }
          : team
      )
    );

    setIsFormOpen(false);
    setEditingId(null);
    setForm(createDefaultForm());
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground lg:text-2xl">Times e Categorias</h1>
      <p className="mt-1 text-sm text-muted-foreground lg:text-base">
        Gerencie categoria, liga e escudo dos times. O escudo deve ser gerenciado aqui.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={openCreateForm}>
          <Plus className="mr-1 h-4 w-4" /> Novo time
        </Button>
        <a
          href="https://football-logos.cc/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary"
        >
          Abrir football-logos.cc
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar time, id ou liga..."
            className="bg-secondary pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={categoryFilter === "all" ? "default" : "outline"}
            onClick={() => setCategoryFilter("all")}
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.slug}
              size="sm"
              variant={categoryFilter === category.slug ? "default" : "outline"}
              onClick={() => setCategoryFilter(category.slug)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <Card className="mt-6 border-border bg-card shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Liga</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Logo URL</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{team.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {team.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{getCategoryName(categories, team.category)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{team.league || "-"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span className="line-clamp-1 max-w-[360px]">{team.logo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditForm(team)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeTeam(team)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl border-border bg-card shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">{editingId ? "Editar time" : "Novo time"}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                  setForm(createDefaultForm());
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveTeam} className="grid gap-3 md:grid-cols-2">
                <Input
                  value={form.id}
                  onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="ID (ex: real-madrid)"
                  className="bg-secondary"
                  disabled={!!editingId}
                />
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome"
                  className="bg-secondary"
                  required
                />

                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as Category }))}
                  className="h-10 rounded-md border border-input bg-secondary px-3 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <Input
                  value={form.league}
                  onChange={(e) => setForm((prev) => ({ ...prev, league: e.target.value }))}
                  placeholder="Liga (opcional)"
                  className="bg-secondary"
                />

                <Input
                  value={form.logo}
                  onChange={(e) => setForm((prev) => ({ ...prev, logo: e.target.value }))}
                  placeholder="URL do escudo (football-logos)"
                  className="bg-secondary md:col-span-2"
                  required
                />

                {form.logo.trim() && (
                  <div className="md:col-span-2 rounded-md border border-border bg-secondary p-3">
                    <p className="mb-2 text-xs text-muted-foreground">Preview do escudo</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logo}
                      alt="Preview do escudo"
                      className="h-16 w-16 rounded-full border border-border bg-card object-contain p-1"
                    />
                  </div>
                )}

                <div className="md:col-span-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Para encontrar o escudo: football-logos.cc</span>
                  <a href="https://football-logos.cc/" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Abrir football-logos.cc
                  </a>
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit">Salvar</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingId(null);
                      setForm(createDefaultForm());
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
