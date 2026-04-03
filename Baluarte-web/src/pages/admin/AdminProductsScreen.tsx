import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Alert, Pressable, Text, TextInput, View, useWindowDimensions } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import styles from "../../App.styles";
import { createAdminProduct } from "../../lib/admin-creators";
import { toBrl } from "../../lib/format";
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
import type { AdminProductsScreenProps, ValidSize } from "./types";

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

function AdminProductsScreenContent({ user, categories, teams, products, onBack, onUpdateProducts, initialDraft }: AdminProductsScreenContentProps) {
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

  const createProduct = () => {
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

    const pricing = buildPricing(basePrice, optionalDiscount);
    setCreateSubmitting(true);
    setCreateErrors([]);

    const next = createAdminProduct(
      createDraft.name,
      createDraft.description,
      pricing.finalPrice,
      createDraft.images,
      selectedTeam,
      sanitizeStockBySize(createDraft.stockBySize),
      pricing.originalPrice
    );

    onUpdateProducts([next, ...products]);
    setCreateSubmitting(false);
    dispatch({ type: "CLOSE_CREATE" });
    showToast("✅ Produto cadastrado com sucesso!", "success", 3000);
  };

  const saveEdit = () => {
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

    const pricing = buildPricing(basePrice, optionalDiscount);
    const nextStockBySize = sanitizeStockBySize(editDraft.stockBySize);
    const stockQuantity = Object.values(nextStockBySize).reduce((sum, value) => sum + value, 0);
    setEditErrors([]);

    onUpdateProducts(
      products.map((item) =>
        item.id === editingProductId
          ? {
              ...item,
              name: editDraft.name.trim(),
              description: editDraft.description.trim(),
              teamId: selectedTeam.id,
              team: selectedTeam,
              sizes: SIZE_ORDER,
              price: pricing.finalPrice,
              originalPrice: pricing.originalPrice,
              stockBySize: nextStockBySize,
              stockQuantity,
              inStock: stockQuantity > 0,
              image: editDraft.images[0],
              images: [...editDraft.images]
            }
          : item
      )
    );

    dispatch({ type: "CLOSE_EDIT" });
    dispatch({ type: "SET_EDITING_PRODUCT_ID", payload: null });
    setEditDraft(null);
    showToast("✅ Produto atualizado com sucesso!", "success", 3000);
  };

  const restockProduct = (productId: string, delta: number, targetSize: ValidSize | "ALL"): number => {
    let addedUnits = 0;
    onUpdateProducts(
      products.map((product) => {
        if (product.id !== productId) {
          return product;
        }
        const nextStockBySize = { ...product.stockBySize };
        if (targetSize === "ALL") {
          SIZE_ORDER.forEach((size) => {
            nextStockBySize[size] = Math.max(0, (nextStockBySize[size] ?? 0) + delta);
            addedUnits += delta;
          });
        } else {
          nextStockBySize[targetSize] = Math.max(0, (nextStockBySize[targetSize] ?? 0) + delta);
          addedUnits += delta;
        }
        const stockQuantity = Object.values(nextStockBySize).reduce((sum, value) => sum + value, 0);
        return {
          ...product,
          stockBySize: nextStockBySize,
          stockQuantity,
          inStock: stockQuantity > 0
        };
      })
    );
    return addedUnits;
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
        onPress: () => {
          const addedUnits = restockProduct(activeRestockProduct.id, delta, restockSize);
          showToast(`✅ Estoque atualizado: +${addedUnits} item(ns)`, "success", 2500);
          setRestockProductId(null);
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
                  "Tem certeza que quer excluir este produto? Esta ação não pode ser desfeita.",
                  [
                    { text: "Cancelar", onPress: () => {}, style: "cancel" },
                    {
                      text: "Excluir",
                      onPress: () => onUpdateProducts(products.filter((item) => item.id !== product.id)),
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
