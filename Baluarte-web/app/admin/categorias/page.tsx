"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teams as defaultTeams } from "@/lib/data";
import { AdminCategory, Team } from "@/lib/types";
import {
  CATEGORY_STORAGE_KEY,
  defaultCategories,
  normalizeCategories,
  slugifyCategory,
} from "@/lib/admin-categories";
import { Edit3, ExternalLink, Plus, Trash2, X } from "lucide-react";

const TEAMS_STORAGE_KEY = "admin_teams_v1";

type CategoryFormState = {
  slug: string;
  name: string;
  logo: string;
};

const createDefaultForm = (): CategoryFormState => ({
  slug: "",
  name: "",
  logo: "",
});

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>(defaultCategories);
  const [teamList, setTeamList] = useState<Team[]>(defaultTeams);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(createDefaultForm());

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
      const savedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (savedTeams) {
        const parsed = JSON.parse(savedTeams) as Team[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTeamList(parsed);
        }
      }
    } catch {
      setTeamList(defaultTeams);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  const usageCountByCategory = useMemo(() => {
    return teamList.reduce<Record<string, number>>((acc, team) => {
      acc[team.category] = (acc[team.category] || 0) + 1;
      return acc;
    }, {});
  }, [teamList]);

  const openCreateForm = () => {
    setEditingSlug(null);
    setForm(createDefaultForm());
    setIsFormOpen(true);
  };

  const openEditForm = (category: AdminCategory) => {
    setEditingSlug(category.slug);
    setForm({
      slug: category.slug,
      name: category.name,
      logo: category.logo,
    });
    setIsFormOpen(true);
  };

  const saveCategory = (event: React.FormEvent) => {
    event.preventDefault();

    const name = form.name.trim();
    const logo = form.logo.trim();
    const slugInput = editingSlug ? editingSlug : form.slug || form.name;
    const slug = slugifyCategory(slugInput);

    if (!name) {
      window.alert("Informe o nome da categoria.");
      return;
    }

    if (!slug) {
      window.alert("Informe um identificador valido para a categoria.");
      return;
    }

    if (!logo) {
      window.alert("Informe a URL do logo da categoria.");
      return;
    }

    setCategories((prev) => {
      const slugAlreadyExists = prev.some((category) => category.slug === slug && category.slug !== editingSlug);
      if (slugAlreadyExists) {
        window.alert("Ja existe uma categoria com esse identificador.");
        return prev;
      }

      if (editingSlug) {
        return prev.map((category) =>
          category.slug === editingSlug
            ? {
                ...category,
                name,
                logo,
              }
            : category
        );
      }

      return [
        ...prev,
        {
          slug,
          name,
          logo,
        },
      ];
    });

    setIsFormOpen(false);
    setEditingSlug(null);
    setForm(createDefaultForm());
  };

  const removeCategory = (category: AdminCategory) => {
    const usage = usageCountByCategory[category.slug] || 0;
    if (usage > 0) {
      window.alert(`Nao e possivel remover. Existem ${usage} time(s) nessa categoria.`);
      return;
    }

    if (!window.confirm(`Deseja remover a categoria ${category.name}?`)) {
      return;
    }

    setCategories((prev) => prev.filter((item) => item.slug !== category.slug));
  };

  const suggestSlug = () => {
    const suggested = slugifyCategory(form.name);
    if (suggested) {
      setForm((prev) => ({ ...prev, slug: suggested }));
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground lg:text-2xl">Categorias</h1>
      <p className="mt-1 text-sm text-muted-foreground lg:text-base">
        Adicione, remova e atualize o logo das categorias no front-end.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={openCreateForm}>
          <Plus className="mr-1 h-4 w-4" /> Nova categoria
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const usage = usageCountByCategory[category.slug] || 0;
          return (
            <Card key={category.slug} className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-3 text-foreground">
                  <span>{category.name}</span>
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                    {usage} time(s)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={category.logo}
                    alt={`Logo de ${category.name}`}
                    className="h-12 w-12 rounded-full border border-border bg-secondary object-contain p-1"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">Slug</p>
                    <p className="text-sm font-medium text-foreground">{category.slug}</p>
                  </div>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{category.logo}</p>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditForm(category)}>
                    <Edit3 className="mr-1 h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeCategory(category)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-xl border-border bg-card shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">{editingSlug ? "Editar categoria" : "Nova categoria"}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingSlug(null);
                  setForm(createDefaultForm());
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveCategory} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome</label>
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Ex: Europeias"
                    className="bg-secondary"
                    required
                  />
                </div>

                {!editingSlug && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-xs font-medium text-muted-foreground">Slug</label>
                      <button
                        type="button"
                        onClick={suggestSlug}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Gerar pelo nome
                      </button>
                    </div>
                    <Input
                      value={form.slug}
                      onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                      placeholder="ex: europeias"
                      className="bg-secondary"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">URL do logo</label>
                  <Input
                    value={form.logo}
                    onChange={(event) => setForm((prev) => ({ ...prev, logo: event.target.value }))}
                    placeholder="Cole URL do logo do football-logos.cc"
                    className="bg-secondary"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dica: copie o endereco da imagem no football-logos.cc para manter visual consistente.
                  </p>
                </div>

                {form.logo.trim() && (
                  <div className="rounded-md border border-border bg-secondary p-3">
                    <p className="mb-2 text-xs text-muted-foreground">Preview do logo</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.logo} alt="Preview do logo" className="h-14 w-14 rounded-full border border-border bg-card object-contain p-1" />
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button type="submit">Salvar</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingSlug(null);
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
