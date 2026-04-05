import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Alert, Pressable, Text, TextInput, View, useWindowDimensions } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import {
  createAdminProductApi,
  deleteAdminProductApi,
  resolveTeamBySlug,
  updateAdminProductApi
} from "../../lib/mobile/api/admin-products";
import type { NormalizedApiError, ApiAuthorizationContext } from "../../lib/mobile/api/contracts";
import { ProductFormModal } from "../../components/admin/ProductFormModal";
import { RestockActionSheet } from "../../components/admin/RestockActionSheet";
import { ProductFormStepOne } from "../../components/admin/ProductFormStepOne";
import { ProductFormStepThree } from "../../components/admin/ProductFormStepThree";
import { ProductFormStepTwo } from "../../components/admin/ProductFormStepTwo";
import type { ProductFormDraft, ProductFormStep } from "../../components/admin/ProductFormTypes";
import { ProductFormProvider, useProductFormContext } from "../../context/ProductFormContext";
import type { ProductFormAction } from "../../context/productFormReducer";
import { useToast } from "../../hooks/useToast";
import { AdminBlockedScreen } from "./AdminBlockedScreen";
import type { AdminProduct, AdminProductsScreenProps, ValidSize } from "./types";

const SIZE_ORDER: ValidSize[] = ["P", "M", "G", "GG"];

const defaultStock = (): Record<ValidSize, string> => ({ P: "10", M: "10", G: "10", GG: "10" });

type AdminProductsScreenContentProps = AdminProductsScreenProps & {
  initialDraft: ProductFormDraft;
};

export function AdminProductsScreen(props: AdminProductsScreenProps) {
  const { user, categories, teams } = props;
  const defaultCategory = categories[0]?.slug ?? "nacionais";
  const defaultTeamId = teams.find((team) => team.category === defaultCategory)?.id ?? teams[0]?.id ?? "";

  if (!user || user.role !== "admin") {
    return <AdminBlockedScreen onBack={props.onBack} message="Acesso admin necessario para produtos." />;
  }

  const initialDraft: ProductFormDraft = {
    name: "",
    description: "",
    price: "299.90",
    discountPrice: "",
    customizationEnabled: false,
    customizationTemplatePng: "",
    category: defaultCategory,
    teamId: defaultTeamId,
    stockBySize: defaultStock(),
    images: []
  };

  return (
    <ProductFormProvider initialDraft={initialDraft}>
      <AdminProductsScreenContent {...props} initialDraft={initialDraft} />
    </ProductFormProvider>
  );
}

function AdminProductsScreenContent({ user, authSession, categories, teams, products, onBack, onUpdateProducts, initialDraft }: AdminProductsScreenContentProps) {
  const { height: windowHeight } = useWindowDimensions();

  const { state: formState, dispatch } = useProductFormContext();

  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [restockSize, setRestockSize] = useState<ValidSize | "ALL">("ALL");

  const {
    isCreateOpen,
    createStep,
    createDraft,
    createImageUrl,
    createSubmitting,
    createErrors,
    editingProductId,
    isEditOpen,
    editStep,
    editDraft,
    editImageUrl,
    editErrors,
    openSelectKey,
    selectSearch
  } = formState;

  const bindSetter = <T,>(currentValue: T, toAction: (value: T) => ProductFormAction): Dispatch<SetStateAction<T>> => {
    return (next) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(currentValue) : next;
      dispatch(toAction(resolved));
    };
  };

  const setCreateStep = bindSetter(createStep, (value) => ({ type: "SET_CREATE_STEP", payload: value }));
  const setCreateDraft = bindSetter(createDraft, (value) => ({ type: "SET_CREATE_DRAFT", payload: value }));
  const setCreateImageUrl = bindSetter(createImageUrl, (value) => ({ type: "SET_CREATE_IMAGE_URL", payload: value }));
  const setCreateSubmitting = bindSetter(createSubmitting, (value) => ({ type: "SET_CREATE_SUBMITTING", payload: value }));
  const setCreateErrors = bindSetter(createErrors, (value) => ({ type: "SET_CREATE_ERRORS", payload: value }));
  const setEditStep = bindSetter(editStep, (value) => ({ type: "SET_EDIT_STEP", payload: value }));
  const setEditDraft = bindSetter(editDraft, (value) => ({ type: "SET_EDIT_DRAFT", payload: value }));
  const setEditImageUrl = bindSetter(editImageUrl, (value) => ({ type: "SET_EDIT_IMAGE_URL", payload: value }));
  const setEditErrors = bindSetter(editErrors, (value) => ({ type: "SET_EDIT_ERRORS", payload: value }));
  const setOpenSelectKey = bindSetter(openSelectKey, (value) => ({ type: "SET_OPEN_SELECT_KEY", payload: value }));
  const setSelectSearch = bindSetter(selectSearch, (value) => ({ type: "SET_SELECT_SEARCH", payload: value }));

  const parseMoney = (value: string): number | null => {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  };

  const buildPricing = (basePrice: number, optionalDiscount: number | null): { finalPrice: number; originalPrice?: number } => {
    if (optionalDiscount && optionalDiscount < basePrice) {
      return { finalPrice: optionalDiscount, originalPrice: basePrice };
    }
    return { finalPrice: basePrice };
  };

  const sanitizeStockBySize = (raw: Record<ValidSize, string>): Record<ValidSize, number> => {
    return SIZE_ORDER.reduce<Record<ValidSize, number>>((acc, size) => {
      const parsed = Number(raw[size].replace(",", "."));
      if (Number.isFinite(parsed) && parsed >= 0 && Number.isInteger(parsed)) {
        acc[size] = parsed;
      } else if (Number.isFinite(parsed) && parsed >= 0) {
        acc[size] = Math.floor(parsed);
      } else {
        acc[size] = 0;
      }
      return acc;
    }, { P: 0, M: 0, G: 0, GG: 0 });
  };

  const isValidImageUrl = (url: string): boolean => {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some((ext) => lowerUrl.includes(ext));
  };

  const isValidPngTemplate = (value: string): boolean => {
    const lowerValue = value.trim().toLowerCase();
    return lowerValue.length > 0 && lowerValue.includes(".png");
  };

  const isNormalizedApiError = (value: unknown): value is NormalizedApiError => {
    return Boolean(
      value &&
        typeof value === "object" &&
        "code" in value &&
        "message" in value &&
        typeof (value as Record<string, unknown>).code === "string" &&
        typeof (value as Record<string, unknown>).message === "string"
    );
  };

  const extractFieldLevelErrors = (error: NormalizedApiError): string[] => {
    if (Array.isArray(error.details)) {
      return error.details.filter((item): item is string => typeof item === "string");
    }

    return [error.message];
  };

  const buildAuthorizationContext = (): ApiAuthorizationContext | undefined => {
    if (!user || !authSession) {
      return undefined;
    }

    return {
      clerkIdentity: {
        clerkUserId: user.id,
        email: user.email
      },
      internalRole: authSession.internalRole
    };
  };

  const toAdminProductFromApi = (
    dto: {
      id: string;
      teamSlug: string;
      modelName: string;
      description: string;
      price: number;
      originalPrice?: number;
      imageUrl: string;
      customizationEnabled: boolean;
      customizationTemplatePng?: string;
      active: boolean;
      stockQuantity: number;
      variants: { size: ValidSize; stockQuantity: number }[];
    },
    fallbackTeam: (typeof teams)[number]
  ): AdminProduct => {
    const resolvedTeam = resolveTeamBySlug(dto.teamSlug, teams) ?? fallbackTeam;
    const stockBySize = SIZE_ORDER.reduce<Record<ValidSize, number>>((acc, size) => {
      const variant = dto.variants.find((item) => item.size === size);
      acc[size] = variant?.stockQuantity ?? 0;
      return acc;
    }, { P: 0, M: 0, G: 0, GG: 0 });

    return {
      id: dto.id,
      name: dto.modelName,
      description: dto.description,
      teamId: resolvedTeam.id,
      team: resolvedTeam,
      sizes: SIZE_ORDER,
      price: dto.price,
      originalPrice: dto.originalPrice,
      stockBySize,
      stockQuantity: dto.stockQuantity,
      inStock: dto.active && dto.stockQuantity > 0,
      image: dto.imageUrl,
      images: [dto.imageUrl],
      customizationEnabled: dto.customizationEnabled,
      customizationTemplatePng: dto.customizationTemplatePng
    };
  };

  const categoryOptions = categories
    .map((item) => ({ value: item.slug, label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const teamsByCategory = (category: string) => teams.filter((team) => team.category === category);

  const setCategoryOnDraft = (
    setDraft: React.Dispatch<React.SetStateAction<ProductFormDraft>>,
    nextCategory: string
  ) => {
    setDraft((prev) => {
      const firstTeam = teamsByCategory(nextCategory)[0];
      return {
        ...prev,
        category: nextCategory,
        teamId: firstTeam?.id ?? prev.teamId
      };
    });
  };

  const appendImages = (
    setDraft: Dispatch<SetStateAction<ProductFormDraft>>,
    uris: string[]
  ) => {
    const cleaned = uris.map((item) => item.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      return;
    }
    setDraft((prev) => ({
      ...prev,
      images: Array.from(new Set([...prev.images, ...cleaned]))
    }));
  };

  const pickFromGallery = async (setDraft: Dispatch<SetStateAction<ProductFormDraft>>) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.9
    });
    if (result.canceled) {
      return;
    }
    appendImages(setDraft, result.assets.map((asset) => asset.uri));
  };

  const takePhoto = async (setDraft: Dispatch<SetStateAction<ProductFormDraft>>) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera", "Permissao da camera nao concedida.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (result.canceled) {
      return;
    }
    appendImages(setDraft, result.assets.map((asset) => asset.uri));
  };

  const pickFromFiles = async (setDraft: Dispatch<SetStateAction<ProductFormDraft>>) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      multiple: true,
      copyToCacheDirectory: true
    });
    if (result.canceled) {
      return;
    }
    appendImages(setDraft, (result.assets ?? []).map((asset) => asset.uri));
  };

  const openCreate = () => {
    dispatch({ type: "OPEN_CREATE", payload: { createDraft: initialDraft } });
  };

  const openEdit = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    const nextEditDraft: ProductFormDraft = {
      name: product.name,
      description: product.description,
      price: (product.originalPrice ?? product.price).toFixed(2),
      discountPrice: product.originalPrice ? product.price.toFixed(2) : "",
      customizationEnabled: Boolean(product.customizationEnabled),
      customizationTemplatePng: product.customizationTemplatePng ?? "",
      category: product.team.category,
      teamId: product.teamId,
      stockBySize: SIZE_ORDER.reduce<Record<ValidSize, string>>((acc, size) => {
        acc[size] = String(product.stockBySize[size] ?? 0);
        return acc;
      }, { P: "0", M: "0", G: "0", GG: "0" }),
      images: product.images && product.images.length > 0 ? [...product.images] : [product.image]
    };

    dispatch({
      type: "OPEN_EDIT",
      payload: {
        editingProductId: productId,
        editDraft: nextEditDraft
      }
    });
  };

  const createProduct = async () => {
    const errors: string[] = [];
    const selectedTeam = teams.find((team) => team.id === createDraft.teamId);
    const basePrice = parseMoney(createDraft.price);
    const optionalDiscount = createDraft.discountPrice.trim() ? parseMoney(createDraft.discountPrice) : null;

    // Risk #2: Validar que categorias não estão vazias
    const teamsBySelectedCategory = teams.filter((team) => team.category === createDraft.category);
    if (teamsBySelectedCategory.length === 0) {
      errors.push("Categoria não tem times disponíveis");
    }

    // Validação por campo
    if (!createDraft.name.trim()) {
      errors.push("Nome é obrigatório");
    }
    if (!createDraft.description.trim()) {
      errors.push("Descrição é obrigatória");
    }
    if (!basePrice || basePrice <= 0) {
      errors.push("Preço deve ser um número válido e maior que 0");
    }
    if (!selectedTeam) {
      errors.push("Selecione um time válido");
    }
    if (createDraft.discountPrice.trim() && !optionalDiscount) {
      errors.push("Desconto deve ser um número válido ou deixe em branco");
    }
    if (optionalDiscount && basePrice && optionalDiscount >= basePrice) {
      errors.push("Desconto deve ser menor que o preço cheio");
    }
    // Risk #1: Validar mínimo 1% de diferença no desconto
    if (optionalDiscount && basePrice && optionalDiscount >= basePrice * 0.99) {
      errors.push("Desconto deve ter no mínimo 1% de diferença");
    }
    // Risk #3: Validar URLs de imagem
    const invalidImageUrls = createDraft.images.filter((url) => !isValidImageUrl(url));
    if (invalidImageUrls.length > 0) {
      errors.push(`${invalidImageUrls.length} imagem(ns) inválida(s) - use .jpg, .png, .gif, etc.`);
    }
    if (createDraft.images.length === 0) {
      errors.push("Adicione pelo menos uma imagem na etapa 2");
    }
    if (createDraft.customizationEnabled && !createDraft.customizationTemplatePng.trim()) {
      errors.push("Template PNG e obrigatorio quando personalizacao estiver habilitada");
    }
    if (createDraft.customizationEnabled && !isValidPngTemplate(createDraft.customizationTemplatePng)) {
      errors.push("Template de personalizacao deve ser um PNG valido (.png)");
    }

    if (errors.length > 0) {
      setCreateErrors(errors);
      if (createDraft.images.length === 0) {
        setCreateStep(3);
      }
      return;
    }

    if (!basePrice || !selectedTeam) {
      return;
    }

    if (!authSession?.token) {
      setCreateErrors(["Sessao admin expirada. Faca login novamente para criar produtos."]);
      return;
    }

    const pricing = buildPricing(basePrice, optionalDiscount);
    const stockBySize = sanitizeStockBySize(createDraft.stockBySize);
    setCreateSubmitting(true);
    setCreateErrors([]);

    try {
      const created = await createAdminProductApi(
        {
          categorySlug: createDraft.category,
          teamSlug: selectedTeam.id,
          modelName: createDraft.name.trim(),
          description: createDraft.description.trim(),
          price: pricing.finalPrice,
          originalPrice: pricing.originalPrice,
          imageUrl: createDraft.images[0],
          customizationEnabled: createDraft.customizationEnabled,
          customizationTemplatePng: createDraft.customizationEnabled
            ? createDraft.customizationTemplatePng.trim() || undefined
            : undefined,
          variants: SIZE_ORDER.map((size) => ({ size, stockQuantity: stockBySize[size] }))
        },
        {
          authorizationContext: buildAuthorizationContext(),
          bearerToken: authSession.token
        }
      );

      const next = toAdminProductFromApi(created, selectedTeam);
      onUpdateProducts([next, ...products]);
      dispatch({ type: "CLOSE_CREATE" });
      showToast("✅ Produto cadastrado com sucesso!", "success", 3000);
    } catch (error) {
      if (isNormalizedApiError(error)) {
        setCreateErrors(extractFieldLevelErrors(error));
      } else {
        setCreateErrors(["Nao foi possivel criar o produto no backend."]);
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const saveEdit = async () => {
    if (!editingProductId || !editDraft) {
      return;
    }

    const errors: string[] = [];
    const selectedTeam = teams.find((team) => team.id === editDraft.teamId);
    const basePrice = parseMoney(editDraft.price);
    const optionalDiscount = editDraft.discountPrice.trim() ? parseMoney(editDraft.discountPrice) : null;

    // Risk #2: Validar que categorias não estão vazias
    const teamsBySelectedCategory = teams.filter((team) => team.category === editDraft.category);
    if (teamsBySelectedCategory.length === 0) {
      errors.push("Categoria não tem times disponíveis");
    }

    // Validação por campo
    if (!editDraft.name.trim()) {
      errors.push("Nome é obrigatório");
    }
    if (!editDraft.description.trim()) {
      errors.push("Descrição é obrigatória");
    }
    if (!basePrice || basePrice <= 0) {
      errors.push("Preço deve ser um número válido e maior que 0");
    }
    if (!selectedTeam) {
      errors.push("Selecione um time válido");
    }
    if (editDraft.discountPrice.trim() && !optionalDiscount) {
      errors.push("Desconto deve ser um número válido ou deixe em branco");
    }
    if (optionalDiscount && basePrice && optionalDiscount >= basePrice) {
      errors.push("Desconto deve ser menor que o preço cheio");
    }
    // Risk #1: Validar mínimo 1% de diferença no desconto
    if (optionalDiscount && basePrice && optionalDiscount >= basePrice * 0.99) {
      errors.push("Desconto deve ter no mínimo 1% de diferença");
    }
    // Risk #3: Validar URLs de imagem
    const invalidImageUrls = editDraft.images.filter((url) => !isValidImageUrl(url));
    if (invalidImageUrls.length > 0) {
      errors.push(`${invalidImageUrls.length} imagem(ns) inválida(s) - use .jpg, .png, .gif, etc.`);
    }
    if (editDraft.images.length === 0) {
      errors.push("Mantenha ao menos uma imagem do produto");
    }
    if (editDraft.customizationEnabled && !editDraft.customizationTemplatePng.trim()) {
      errors.push("Template PNG e obrigatorio quando personalizacao estiver habilitada");
    }
    if (editDraft.customizationEnabled && !isValidPngTemplate(editDraft.customizationTemplatePng)) {
      errors.push("Template de personalizacao deve ser um PNG valido (.png)");
    }

    if (errors.length > 0) {
      setEditErrors(errors);
      if (editDraft.images.length === 0) {
        setEditStep(3);
      }
      return;
    }

    if (!basePrice || !selectedTeam) {
      return;
    }

    if (!authSession?.token) {
      setEditErrors(["Sessao admin expirada. Faca login novamente para editar produtos."]);
      return;
    }

    const pricing = buildPricing(basePrice, optionalDiscount);
    const nextStockBySize = sanitizeStockBySize(editDraft.stockBySize);
    setEditErrors([]);

    try {
      const updated = await updateAdminProductApi(
        editingProductId,
        {
          categorySlug: editDraft.category,
          teamSlug: selectedTeam.id,
          modelName: editDraft.name.trim(),
          description: editDraft.description.trim(),
          price: pricing.finalPrice,
          originalPrice: pricing.originalPrice,
          imageUrl: editDraft.images[0],
          customizationEnabled: editDraft.customizationEnabled,
          customizationTemplatePng: editDraft.customizationEnabled
            ? editDraft.customizationTemplatePng.trim() || undefined
            : undefined,
          variants: SIZE_ORDER.map((size) => ({
            size,
            stockQuantity: nextStockBySize[size]
          }))
        },
        {
          authorizationContext: buildAuthorizationContext(),
          bearerToken: authSession.token
        }
      );

      onUpdateProducts(
        products.map((item) =>
          item.id === editingProductId ? toAdminProductFromApi(updated, selectedTeam) : item
        )
      );

      dispatch({ type: "CLOSE_EDIT" });
      dispatch({ type: "SET_EDITING_PRODUCT_ID", payload: null });
      setEditDraft(null);
      showToast("✅ Produto atualizado com sucesso!", "success", 3000);
    } catch (error) {
      if (isNormalizedApiError(error)) {
        setEditErrors(extractFieldLevelErrors(error));
      } else {
        setEditErrors(["Nao foi possivel atualizar o produto no backend."]);
      }
    }
  };

  const activeRestockProduct = restockProductId ? products.find((item) => item.id === restockProductId) ?? null : null;

  const requestRestock = (productId: string) => {
    setRestockProductId(productId);
    setRestockSize("ALL");
  };

  const confirmRestock = (delta: number) => {
    if (!activeRestockProduct) {
      return;
    }
    const scopeLabel = restockSize === "ALL" ? "todos os tamanhos" : `tamanho ${restockSize}`;
    Alert.alert("Confirmar reposicao", `Adicionar +${delta} no ${scopeLabel}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          if (!authSession?.token) {
            showToast("Sessao admin expirada. Faca login novamente.", "error", 3000);
            return;
          }

          const product = products.find((item) => item.id === activeRestockProduct.id);
          if (!product) {
            showToast("Produto nao encontrado para reposicao.", "error", 3000);
            return;
          }

          const nextStockBySize = { ...product.stockBySize };
          if (restockSize === "ALL") {
            SIZE_ORDER.forEach((size) => {
              nextStockBySize[size] = Math.max(0, (nextStockBySize[size] ?? 0) + delta);
            });
          } else {
            nextStockBySize[restockSize] = Math.max(0, (nextStockBySize[restockSize] ?? 0) + delta);
          }

          const updatePayload = {
            categorySlug: product.team.category,
            teamSlug: product.teamId,
            modelName: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice,
            imageUrl: product.image,
            customizationEnabled: Boolean(product.customizationEnabled),
            customizationTemplatePng: product.customizationTemplatePng,
            variants: SIZE_ORDER.map((size) => ({
              size,
              stockQuantity: nextStockBySize[size] ?? 0
            }))
          };

          try {
            const updated = await updateAdminProductApi(product.id, updatePayload, {
              authorizationContext: buildAuthorizationContext(),
              bearerToken: authSession.token
            });

            const addedUnits = restockSize === "ALL" ? delta * SIZE_ORDER.length : delta;
            onUpdateProducts(
              products.map((item) =>
                item.id === product.id ? toAdminProductFromApi(updated, item.team) : item
              )
            );
            showToast(`✅ Estoque atualizado: +${addedUnits} item(ns)`, "success", 2500);
            setRestockProductId(null);
          } catch (error) {
            if (isNormalizedApiError(error)) {
              showToast(error.message, "error", 3000);
            } else {
              showToast("Nao foi possivel atualizar o estoque no backend.", "error", 3000);
            }
          }
        }
      }
    ]);
  };

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const q = search.trim().toLowerCase();
      if (!q) {
        return true;
      }
      return product.name.toLowerCase().includes(q) || product.id.toLowerCase().includes(q) || product.team.name.toLowerCase().includes(q);
    });
  }, [products, search]);

  const setEditDraftSafe: Dispatch<SetStateAction<ProductFormDraft>> = (next) => {
    setEditDraft((prev) => {
      if (!prev) {
        return prev;
      }
      return typeof next === "function" ? (next as (value: ProductFormDraft) => ProductFormDraft)(prev) : next;
    });
  };

  const renderFormStep = (
    draft: ProductFormDraft,
    setDraft: Dispatch<SetStateAction<ProductFormDraft>>,
    imageUrl: string,
    setImageUrl: Dispatch<SetStateAction<string>>,
    step: ProductFormStep,
    selectPrefix: "create" | "edit"
  ) => {
    const teamOptions = teamsByCategory(draft.category)
      .map((team) => ({ value: team.id, label: team.name }))
      .sort((a, b) => a.label.localeCompare(b.label));

    if (step === 1) {
      return (
        <ProductFormStepOne
          draft={draft}
          setDraft={setDraft}
          categories={categoryOptions}
          teams={teamOptions}
          categoryLabel={categories.find((item) => item.slug === draft.category)?.name ?? draft.category}
          teamLabel={teams.find((item) => item.id === draft.teamId)?.name ?? "Selecione"}
          selectPrefix={selectPrefix}
          openSelectKey={openSelectKey}
          setOpenSelectKey={setOpenSelectKey}
          selectSearch={selectSearch}
          setSelectSearch={setSelectSearch}
          onSelectCategory={(value) => setCategoryOnDraft(setDraft, value)}
        />
      );
    }

    if (step === 2) {
      return <ProductFormStepTwo draft={draft} setDraft={setDraft} sizes={SIZE_ORDER} selectPrefix={selectPrefix} />;
    }

    return (
      <ProductFormStepThree
        draft={draft}
        setDraft={setDraft}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        onAddImages={(uris) => appendImages(setDraft, uris)}
        onPickFromGallery={() => pickFromGallery(setDraft)}
        onTakePhoto={() => takePhoto(setDraft)}
        onPickFromFiles={() => pickFromFiles(setDraft)}
      />
    );
  };

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar ao dashboard</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Produtos</Text>

      <View style={styles.summaryCard}>
        <Pressable style={styles.primaryActionButton} onPress={openCreate}>
          <Text style={styles.primaryActionButtonText}>Cadastrar produto</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <TextInput style={styles.formInput} value={search} onChangeText={setSearch} placeholder="Buscar produto, time ou ID" placeholderTextColor="#9ca3af" />
      </View>

      {filtered.map((product) => (
        <View key={product.id} style={[styles.summaryCard, styles.adminProductCard]}>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryTitle}>{product.name}</Text>
            {product.originalPrice ? (
              <View style={styles.priceRow}>
                <Text style={styles.productPriceOriginal}>{toBrl(product.originalPrice)}</Text>
                <Text style={styles.summaryValue}>{toBrl(product.price)}</Text>
              </View>
            ) : (
              <Text style={styles.summaryValue}>{toBrl(product.price)}</Text>
            )}
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.summaryKey}>Estoque total</Text>
            <Text style={styles.summaryValue}>{product.stockQuantity}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryKey}>P/M/G/GG</Text>
            <Text style={styles.summaryValue}>
              {SIZE_ORDER.map((size) => `${size}:${product.stockBySize[size] ?? 0}`).join(" | ")}
            </Text>
          </View>
          {product.originalPrice ? (
            <View style={styles.summaryLine}>
              <Text style={styles.summaryKey}>Desconto</Text>
              <Text style={styles.shippingValue}>
                {Math.max(0, Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100))}% OFF
              </Text>
            </View>
          ) : null}

          <View style={styles.inlineActionRow}>
            <Pressable style={styles.secondaryActionButton} onPress={() => openEdit(product.id)}>
              <Text style={styles.secondaryActionButtonText}>Editar</Text>
            </Pressable>
            <Pressable style={styles.secondaryActionButton} onPress={() => requestRestock(product.id)}>
              <Text style={styles.secondaryActionButtonText}>Repor estoque</Text>
            </Pressable>
            <Pressable
              style={styles.dangerButton}
              onPress={() => {
                Alert.alert(
                  "Confirmar exclusão",
                  "Tem certeza que quer excluir este produto? Esta ação desativa o produto no catalogo.",
                  [
                    { text: "Cancelar", onPress: () => {}, style: "cancel" },
                    {
                      text: "Excluir",
                      onPress: async () => {
                        if (!authSession?.token) {
                          showToast("Sessao admin expirada. Faca login novamente.", "error", 3000);
                          return;
                        }

                        try {
                          await deleteAdminProductApi(product.id, {
                            authorizationContext: buildAuthorizationContext(),
                            bearerToken: authSession.token
                          });
                          onUpdateProducts(products.filter((item) => item.id !== product.id));
                          showToast("✅ Produto removido com sucesso!", "success", 2500);
                        } catch (error) {
                          if (isNormalizedApiError(error)) {
                            showToast(error.message, "error", 3000);
                          } else {
                            showToast("Nao foi possivel excluir o produto no backend.", "error", 3000);
                          }
                        }
                      },
                      style: "destructive"
                    }
                  ]
                );
              }}
            >
              <Text style={styles.dangerButtonText}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <RestockActionSheet
        visible={Boolean(activeRestockProduct)}
        productName={activeRestockProduct?.name ?? ""}
        selectedSize={restockSize}
        onSelectSize={setRestockSize}
        onRestockDelta={confirmRestock}
        onClose={() => setRestockProductId(null)}
      />

      <ProductFormModal
        visible={isCreateOpen}
        title="Cadastrar produto"
        step={createStep}
        errors={createErrors}
        windowHeight={windowHeight}
        onClose={() => dispatch({ type: "CLOSE_CREATE" })}
        onBack={() => setCreateStep((prev) => (prev === 1 ? prev : ((prev - 1) as ProductFormStep)))}
        onNext={() => setCreateStep((prev) => (prev === 3 ? prev : ((prev + 1) as ProductFormStep)))}
        onSubmit={createProduct}
        submitLabel={createSubmitting ? "Cadastrando..." : "Cadastrar produto"}
        submitDisabled={createSubmitting}
      >
        {renderFormStep(createDraft, setCreateDraft, createImageUrl, setCreateImageUrl, createStep, "create")}
      </ProductFormModal>

      <ProductFormModal
        visible={isEditOpen}
        title="Editar produto"
        step={editStep}
        errors={editErrors}
        windowHeight={windowHeight}
        onClose={() => dispatch({ type: "CLOSE_EDIT" })}
        onBack={() => setEditStep((prev) => (prev === 1 ? prev : ((prev - 1) as ProductFormStep)))}
        onNext={() => setEditStep((prev) => (prev === 3 ? prev : ((prev + 1) as ProductFormStep)))}
        onSubmit={saveEdit}
        submitLabel="Salvar edicao"
      >
        {editDraft ? renderFormStep(editDraft, setEditDraftSafe, editImageUrl, setEditImageUrl, editStep, "edit") : null}
      </ProductFormModal>
    </View>
  );
}
