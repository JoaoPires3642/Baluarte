"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products, teams as defaultTeams } from "@/lib/data";
import { AdminCategory, Category, Product, Size, Team } from "@/lib/types";
import {
  CATEGORY_STORAGE_KEY,
  defaultCategories,
  getCategoryName,
  normalizeCategories,
} from "@/lib/admin-categories";
import { ImagePlus, Package, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";

const PRODUCTS_STORAGE_KEY = "admin_products_v1";
const TEAMS_STORAGE_KEY = "admin_teams_v1";
const VALID_SIZES: Size[] = ["P", "M", "G", "GG"];

type AdminProduct = Product & {
  stockQuantity: number;
};

type ProductFormState = {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  category: Category;
  teamId: string;
  sizes: string;
  stockQuantity: string;
  featured: boolean;
  images: string[];
};

const normalizeProducts = (items: Product[]): AdminProduct[] => {
  return items.map((item) => {
    const savedQuantity = (item as Partial<AdminProduct>).stockQuantity;
    const stockQuantity = Number.isFinite(savedQuantity)
      ? Math.max(0, Number(savedQuantity))
      : item.inStock
      ? 10
      : 0;

    const imageList = item.images && item.images.length > 0 ? item.images : [item.image];

    return {
      ...item,
      image: imageList[0],
      images: imageList,
      inStock: stockQuantity > 0,
      stockQuantity,
    };
  });
};

const createDefaultForm = (teamList: Team[]): ProductFormState => ({
  id: "",
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  category: teamList[0]?.category ?? "nacionais",
  teamId: teamList[0]?.id ?? "",
  sizes: "P,M,G,GG",
  stockQuantity: "10",
  featured: false,
  images: [],
});

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Falha ao carregar imagem"));
    reader.readAsDataURL(file);
  });

export default function ProductsPage() {
  const [teamList, setTeamList] = useState<Team[]>(defaultTeams);
  const [categories, setCategories] = useState<AdminCategory[]>(defaultCategories);
  const [productList, setProductList] = useState<AdminProduct[]>(() => normalizeProducts(products));
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "out">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState("1");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [form, setForm] = useState<ProductFormState>(() => createDefaultForm(defaultTeams));

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
        const parsedTeams = JSON.parse(savedTeams) as Team[];
        if (Array.isArray(parsedTeams) && parsedTeams.length > 0) {
          setTeamList(parsedTeams);
          setForm((prev) => {
            const exists = parsedTeams.some((team) => team.id === prev.teamId);
            if (exists) return prev;
            return {
              ...prev,
              category: parsedTeams[0].category,
              teamId: parsedTeams[0].id,
            };
          });
        }
      }
    } catch {
      setTeamList(defaultTeams);
    }

    try {
      const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts) as Product[];
        if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
          setProductList(normalizeProducts(parsedProducts));
        }
      }
    } catch {
      setProductList(normalizeProducts(products));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(productList));
  }, [productList]);

  useEffect(() => {
    if (categories.length === 0) return;

    if (!categories.some((category) => category.slug === form.category)) {
      const firstCategory = categories[0].slug;
      const firstTeam = teamList.find((team) => team.category === firstCategory);
      setForm((prev) => ({
        ...prev,
        category: firstCategory,
        teamId: firstTeam?.id ?? "",
      }));
    }
  }, [categories, form.category, teamList]);

  const openCreateForm = () => {
    setEditingProductId(null);
    setImageUrlDraft("");
    setForm(createDefaultForm(teamList));
    setIsFormOpen(true);
  };

  const openEditForm = (product: AdminProduct) => {
    const selectedTeam = teamList.find((team) => team.id === product.teamId);

    setEditingProductId(product.id);
    setImageUrlDraft("");
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      category: selectedTeam?.category ?? product.team.category,
      teamId: product.teamId,
      sizes: product.sizes.join(","),
      stockQuantity: String(product.stockQuantity ?? (product.inStock ? 10 : 0)),
      featured: !!product.featured,
      images: product.images && product.images.length > 0 ? product.images : [product.image],
    });
    setIsFormOpen(true);
  };

  const resetToDefaultProducts = () => {
    if (!window.confirm("Deseja restaurar o catálogo padrão?")) return;
    setProductList(normalizeProducts(products));
    localStorage.removeItem(PRODUCTS_STORAGE_KEY);
    setIsFormOpen(false);
    setIsRestockOpen(false);
    setRestockProductId(null);
    setEditingProductId(null);
  };

  const deleteProduct = (id: string) => {
    if (!window.confirm("Deseja excluir este produto?")) return;
    setProductList((prev) => prev.filter((p) => p.id !== id));
  };

  const depleteStock = (id: string) => {
    setProductList((prev) => prev.map((p) => (p.id === id ? { ...p, inStock: false, stockQuantity: 0 } : p)));
  };

  const openRestockModal = (id: string) => {
    setRestockProductId(id);
    setRestockQuantity("1");
    setIsRestockOpen(true);
  };

  const applyRestock = () => {
    if (!restockProductId) return;

    const quantity = Number(restockQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      window.alert("Informe uma quantidade válida maior que zero.");
      return;
    }

    const parsedQuantity = Math.floor(quantity);

    setProductList((prev) =>
      prev.map((p) =>
        p.id === restockProductId ? { ...p, stockQuantity: parsedQuantity, inStock: parsedQuantity > 0 } : p
      )
    );

    setIsRestockOpen(false);
    setRestockProductId(null);
    setRestockQuantity("1");
  };

  const addImageUrlToForm = () => {
    const url = imageUrlDraft.trim();
    if (!url) return;

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, url],
    }));
    setImageUrlDraft("");
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const dataUrls = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...dataUrls],
      }));
    } catch {
      window.alert("Não foi possível carregar uma ou mais imagens.");
    }

    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const saveProduct = (event: React.FormEvent) => {
    event.preventDefault();

    const selectedTeam = teamList.find((team) => team.id === form.teamId && team.category === form.category);
    if (!selectedTeam) {
      window.alert("Selecione um time válido.");
      return;
    }

    const price = Number(form.price.replace(",", "."));
    const originalPrice = form.originalPrice ? Number(form.originalPrice.replace(",", ".")) : undefined;
    const validOriginalPrice = Number.isFinite(originalPrice) && (originalPrice ?? 0) > 0 ? originalPrice : undefined;
    const stockQuantity = Math.max(0, Math.floor(Number(form.stockQuantity)));

    if (!form.name.trim() || !form.description.trim() || !Number.isFinite(price) || price <= 0) {
      window.alert("Preencha nome, descrição e preço válido.");
      return;
    }

    const cleanedImages = form.images.map((image) => image.trim()).filter((image) => image.length > 0);
    if (cleanedImages.length === 0) {
      window.alert("Adicione pelo menos uma imagem (link ou arquivo).");
      return;
    }

    const parsedSizes = form.sizes
      .split(",")
      .map((size) => size.trim().toUpperCase())
      .filter((size): size is Size => VALID_SIZES.includes(size as Size));

    const nextProduct: Product = {
      id:
        editingProductId ??
        `${form.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      originalPrice: validOriginalPrice,
      image: cleanedImages[0],
      images: cleanedImages,
      teamId: selectedTeam.id,
      team: selectedTeam,
      sizes: parsedSizes.length > 0 ? parsedSizes : ["M"],
      inStock: stockQuantity > 0,
      featured: form.featured,
    };

    const nextAdminProduct: AdminProduct = {
      ...nextProduct,
      stockQuantity,
      inStock: stockQuantity > 0,
    };

    setProductList((prev) => {
      if (editingProductId) {
        return prev.map((product) => (product.id === editingProductId ? nextAdminProduct : product));
      }
      return [nextAdminProduct, ...prev];
    });

    setIsFormOpen(false);
    setEditingProductId(null);
    setImageUrlDraft("");
    setForm(createDefaultForm(teamList));
  };

  const filteredProducts = useMemo(() => {
    return productList.filter((product) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        product.name.toLowerCase().includes(q) ||
        product.team.name.toLowerCase().includes(q) ||
        product.id.toLowerCase().includes(q);

      const matchesStock =
        stockFilter === "all" || (stockFilter === "in" && product.inStock) || (stockFilter === "out" && !product.inStock);

      return matchesSearch && matchesStock;
    });
  }, [productList, search, stockFilter]);

  const totalProducts = productList.length;
  const activeProducts = productList.filter((product) => product.inStock).length;
  const discountedProducts = productList.filter((product) => product.originalPrice && product.originalPrice > product.price).length;
  const teamsForSelectedCategory = teamList.filter((team) => team.category === form.category);

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground lg:text-2xl">Produtos</h1>
      <p className="mt-1 text-sm text-muted-foreground lg:text-base">Gerencie catálogo, disponibilidade e imagens dos produtos</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de produtos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">{totalProducts}</span>
            <Package className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em estoque</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">{activeProducts}</span>
            <Package className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com desconto</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">{discountedProducts}</span>
            <Tag className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por produto, time ou ID..." className="bg-secondary pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={openCreateForm}>
            <Plus className="mr-1 h-4 w-4" /> Novo
          </Button>
          <Button variant={stockFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStockFilter("all")}>Todos</Button>
          <Button variant={stockFilter === "in" ? "default" : "outline"} size="sm" onClick={() => setStockFilter("in")}>Em estoque</Button>
          <Button variant={stockFilter === "out" ? "default" : "outline"} size="sm" onClick={() => setStockFilter("out")}>Esgotados</Button>
          <Button variant="outline" size="sm" onClick={resetToDefaultProducts}>Restaurar</Button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-3xl border-border bg-card shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">{editingProductId ? "Editar produto" : "Novo produto"}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingProductId(null);
                  setImageUrlDraft("");
                  setForm(createDefaultForm(teamList));
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[80vh] overflow-y-auto">
              <form onSubmit={saveProduct} className="grid gap-3 md:grid-cols-2">
                <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nome do produto" className="bg-secondary" required />
                <select
                  value={form.category}
                  onChange={(e) => {
                    const nextCategory = e.target.value as Category;
                    const firstTeam = teamList.find((team) => team.category === nextCategory);
                    setForm((prev) => ({ ...prev, category: nextCategory, teamId: firstTeam?.id ?? "" }));
                  }}
                  className="h-10 rounded-md border border-input bg-secondary px-3 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select value={form.teamId} onChange={(e) => setForm((prev) => ({ ...prev, teamId: e.target.value }))} className="h-10 rounded-md border border-input bg-secondary px-3 text-sm">
                  {teamsForSelectedCategory.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>

                <Input value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} placeholder="Preço (ex: 299.90)" className="bg-secondary" required />
                <Input value={form.originalPrice} onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))} placeholder="Preço original (opcional)" className="bg-secondary" />
                <Input value={form.sizes} onChange={(e) => setForm((prev) => ({ ...prev, sizes: e.target.value }))} placeholder="Tamanhos: P,M,G,GG" className="bg-secondary" />
                <Input type="number" min={0} value={form.stockQuantity} onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))} placeholder="Quantidade em estoque" className="bg-secondary" />

                <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Descrição" className="bg-secondary md:col-span-2" required />

                <div className="md:col-span-2 rounded-md border border-border p-3">
                  <p className="mb-2 text-sm font-medium text-foreground">Imagens do produto</p>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Input value={imageUrlDraft} onChange={(e) => setImageUrlDraft(e.target.value)} placeholder="Cole URL da imagem" className="bg-secondary" />
                    <Button type="button" variant="outline" onClick={addImageUrlToForm}>Adicionar URL</Button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary">
                      <ImagePlus className="h-4 w-4" />
                      Upload do celular/arquivo
                      <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                    </label>
                    <span className="text-xs text-muted-foreground">Pode adicionar várias imagens por link e por arquivo.</span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-6">
                    {form.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="relative overflow-hidden rounded border border-border bg-secondary">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt={`Imagem ${index + 1}`} className="h-20 w-full object-cover" />
                        <button type="button" className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white" onClick={() => removeImage(index)}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-foreground md:col-span-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))} />
                    Destaque
                  </label>
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit">Salvar</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingProductId(null);
                      setImageUrlDraft("");
                      setForm(createDefaultForm(teamList));
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

      <Card className="mt-6 border-border bg-card shadow-sm">
        <CardContent className="p-0">
          <div className="md:hidden">
            {filteredProducts.map((product) => {
              const hasDiscount = product.originalPrice && product.originalPrice > product.price;
              return (
                <div key={product.id} className="border-b border-border p-4 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{product.team.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">R$ {product.price.toFixed(2).replace(".", ",")}</p>
                      {hasDiscount && <p className="text-xs text-muted-foreground line-through">R$ {product.originalPrice!.toFixed(2).replace(".", ",")}</p>}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${product.inStock ? "bg-primary/10 text-primary" : "bg-secondary text-foreground"}`}>
                      {product.inStock ? "Em estoque" : "Esgotado"}
                    </span>
                    <span className="text-xs text-muted-foreground">Qtd: {product.stockQuantity}</span>
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">Imagens: {product.images?.length || 1}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Tamanhos: {product.sizes.join(", ")}</div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => (product.inStock ? depleteStock(product.id) : openRestockModal(product.id))}>
                      {product.inStock ? "Esgotar" : "Repor"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditForm(product)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => deleteProduct(product.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Preço</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Estoque</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Imagens</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Tamanhos</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                  return (
                    <tr key={product.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {product.team.name}
                        <p className="text-xs text-muted-foreground">{getCategoryName(categories, product.team.category)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-primary">R$ {product.price.toFixed(2).replace(".", ",")}</p>
                        {hasDiscount && <p className="text-xs text-muted-foreground line-through">R$ {product.originalPrice!.toFixed(2).replace(".", ",")}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{product.stockQuantity}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{product.images?.length || 1}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{product.sizes.join(", ")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${product.inStock ? "bg-primary/10 text-primary" : "bg-secondary text-foreground"}`}>
                          {product.inStock ? "Em estoque" : "Esgotado"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => (product.inStock ? depleteStock(product.id) : openRestockModal(product.id))}>
                            {product.inStock ? "Esgotar" : "Repor"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditForm(product)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => deleteProduct(product.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</div>}
        </CardContent>
      </Card>

      {isRestockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Repor estoque</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsRestockOpen(false);
                  setRestockProductId(null);
                  setRestockQuantity("1");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground" htmlFor="restock-quantity">
                  Quantidade para repor
                </label>
                <Input
                  id="restock-quantity"
                  type="number"
                  min={1}
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="bg-secondary"
                />

                <div className="flex gap-2">
                  <Button type="button" onClick={applyRestock}>Confirmar</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsRestockOpen(false);
                      setRestockProductId(null);
                      setRestockQuantity("1");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
