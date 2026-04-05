import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import type { ImageStyle, StyleProp } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { Size } from "../../lib/types";
import type { ProductScreenProps } from "./types";

const MAX_CUSTOM_NAME_LENGTH = 14;
const CUSTOM_NAME_PRICE_BRL = 25;
const CUSTOM_NUMBER_DIGIT_PRICE_BRL = 20;
const JERSEY_NUMBER_PATTERN = /^\d{1,2}$/;

const getPreviewNameFontSize = (value: string): number => {
  const normalizedLength = value.replace(/\s+/g, "").length;

  if (normalizedLength <= 8) {
    return 30;
  }
  if (normalizedLength <= 12) {
    return 26;
  }
  if (normalizedLength <= 16) {
    return 22;
  }
  if (normalizedLength <= 20) {
    return 19;
  }
  return 17;
};

const getPreviewNameLetterSpacing = (value: string): number => {
  const normalizedLength = value.replace(/\s+/g, "").length;

  if (normalizedLength <= 10) {
    return 1.5;
  }
  if (normalizedLength <= 16) {
    return 1.1;
  }
  return 0.6;
};

export function ProductScreen({ product, onBackToTeam, onBackHome, onAddToCart, onGoCart }: ProductScreenProps) {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [customNameInput, setCustomNameInput] = useState("");
  const [customNames, setCustomNames] = useState<string[]>([]);
  const [customNumberInput, setCustomNumberInput] = useState("");
  const [customNumber, setCustomNumber] = useState<string | null>(null);

  const sizeStock = useMemo(() => {
    if (!product) {
      return { P: 0, M: 0, G: 0, GG: 0 };
    }
    return product.sizes.reduce<Record<Size, number>>((acc, size) => {
      const available = product.stockBySize?.[size];
      acc[size] = Number.isFinite(available) ? Math.max(0, available as number) : 0;
      return acc;
    }, { P: 0, M: 0, G: 0, GG: 0 });
  }, [product]);

  useEffect(() => {
    setSelectedSize(null);
    setValidationMessage(null);
    setIsPersonalizationOpen(false);
    setCustomNameInput("");
    setCustomNames([]);
    setCustomNumberInput("");
    setCustomNumber(null);
  }, [product?.id]);

  const selectedSizeStock = selectedSize ? sizeStock[selectedSize] ?? 0 : 0;
  const canPersonalize = Boolean(product?.customizationEnabled && product?.customizationTemplatePng);
  const previewName = customNames.join(" ").trim();
  const galleryImages = product?.images?.length ? product.images : product?.image ? [product.image] : [];

  if (!product) {
    return (
      <View style={styles.stackScreen}>
        <Pressable onPress={onBackHome}>
          <Text style={styles.backLink}>Voltar ao inicio</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Produto nao encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={() => onBackToTeam(product.team.id)}>
        <Text style={styles.backLink}>Voltar para {product.team.name}</Text>
      </Pressable>

      {galleryImages.map((imageUrl, index) => (
        <Image
          key={`${product.id}-image-${index}`}
          source={{ uri: imageUrl }}
          style={styles.detailImage as StyleProp<ImageStyle>}
        />
      ))}
      <Text style={styles.productTeam}>{product.team.name}</Text>
      <Text style={styles.screenTitle}>{product.name}</Text>
      {product.originalPrice ? (
        <View style={styles.priceRow}>
          <Text style={styles.detailPriceOriginal}>{toBrl(product.originalPrice)}</Text>
          <Text style={styles.detailPrice}>{toBrl(product.price)}</Text>
        </View>
      ) : (
        <Text style={styles.detailPrice}>{toBrl(product.price)}</Text>
      )}
      <Text style={styles.screenDescription}>{product.description}</Text>

      {canPersonalize ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Personalizacao disponivel</Text>
          <Text style={styles.summaryKey}>Template base configurado para esta camisa.</Text>
          <Pressable
            style={styles.secondaryActionButton}
            onPress={() => setIsPersonalizationOpen((prev) => !prev)}
          >
            <Text style={styles.secondaryActionButtonText}>
              {isPersonalizationOpen ? "Ocultar personalizacao" : "Personalizar camisa"}
            </Text>
          </Pressable>

          {isPersonalizationOpen ? (
            <>
              <Text style={styles.summaryKey}>Adicionar nome personalizado (ate {MAX_CUSTOM_NAME_LENGTH} caracteres)</Text>
              <View style={styles.inlineActionRow}>
                <TextInput
                  style={[styles.formInput, { flex: 1 }]}
                  value={customNameInput}
                  onChangeText={setCustomNameInput}
                  placeholder="Ex: JOAO"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="characters"
                />
                <Pressable
                  style={styles.secondaryActionButton}
                  onPress={() => {
                    const nextName = customNameInput.trim();

                    if (!nextName) {
                      setValidationMessage("Informe um nome valido para personalizacao.");
                      return;
                    }

                    if (nextName.length > MAX_CUSTOM_NAME_LENGTH) {
                      setValidationMessage(`Nome personalizado deve ter no maximo ${MAX_CUSTOM_NAME_LENGTH} caracteres.`);
                      return;
                    }

                    if (customNames.some((name) => name.toLowerCase() === nextName.toLowerCase())) {
                      setValidationMessage("Este nome ja foi adicionado.");
                      return;
                    }

                    setCustomNames((prev) => [...prev, nextName]);
                    setCustomNameInput("");
                    setValidationMessage(null);
                  }}
                >
                  <Text style={styles.secondaryActionButtonText}>Adicionar nome</Text>
                </Pressable>
              </View>

              {customNames.length > 0 ? (
                <View style={styles.chipsRowWrap}>
                  {customNames.map((name) => (
                    <Pressable
                      key={name}
                      style={styles.filterChip}
                      onPress={() => setCustomNames((prev) => prev.filter((item) => item !== name))}
                    >
                      <Text style={styles.filterChipText}>{name} x</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.screenDescription}>Adicione ao menos um nome para aplicar personalizacao.</Text>
              )}

              <Text style={styles.summaryKey}>
                Nomes personalizados: {customNames.length} | Acrescimo: {toBrl(customNames.length * CUSTOM_NAME_PRICE_BRL)}
              </Text>

              <Text style={styles.summaryKey}>Adicionar numero personalizado (1 ou 2 digitos)</Text>
              <View style={styles.inlineActionRow}>
                <TextInput
                  style={[styles.formInput, { flex: 1 }]}
                  value={customNumberInput}
                  onChangeText={setCustomNumberInput}
                  placeholder="Ex: 08"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Pressable
                  style={styles.secondaryActionButton}
                  onPress={() => {
                    const nextNumber = customNumberInput.trim();

                    if (!JERSEY_NUMBER_PATTERN.test(nextNumber)) {
                      setValidationMessage("Numero personalizado deve conter apenas digitos (0-9) com 1 ou 2 caracteres.");
                      return;
                    }

                    setCustomNumber(nextNumber);
                    setCustomNumberInput("");
                    setValidationMessage(null);
                  }}
                >
                  <Text style={styles.secondaryActionButtonText}>Adicionar numero</Text>
                </Pressable>
              </View>

              {customNumber ? (
                <>
                  <Text style={styles.summaryKey}>Numero personalizado: {customNumber}</Text>
                  <Text
                    style={{
                      color: "#0f172a",
                      fontSize: 36,
                      fontWeight: "900",
                      letterSpacing: 4,
                      textAlign: "center"
                    }}
                  >
                    {customNumber}
                  </Text>
                  <Text style={styles.summaryKey}>
                    Acrescimo numero: {toBrl(customNumber.length * CUSTOM_NUMBER_DIGIT_PRICE_BRL)}
                  </Text>
                </>
              ) : (
                <Text style={styles.screenDescription}>Adicione um numero para aplicar a tipografia de camisa.</Text>
              )}

              <Text style={styles.summaryTitle}>Preview da personalizacao</Text>
              {previewName || customNumber ? (
                <View style={styles.personalizationPreviewCard}>
                  <Image
                    testID="personalization-preview-template"
                    source={{ uri: product.customizationTemplatePng as string }}
                    style={styles.personalizationPreviewImage as StyleProp<ImageStyle>}
                  />
                  <View style={styles.personalizationPreviewOverlay}>
                    {previewName ? (
                      <Text
                        style={[
                          styles.personalizationPreviewName,
                          {
                            fontSize: getPreviewNameFontSize(previewName),
                            letterSpacing: getPreviewNameLetterSpacing(previewName)
                          }
                        ]}
                      >
                        {previewName}
                      </Text>
                    ) : null}
                    {customNumber ? <Text style={styles.personalizationPreviewNumber}>{customNumber}</Text> : null}
                  </View>
                </View>
              ) : (
                <Text style={styles.screenDescription}>Adicione nome ou numero para gerar o preview.</Text>
              )}
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.sizesRow}>
        {product.sizes.map((size) => (
          <Pressable
            key={size}
            style={[
              styles.sizePill,
              selectedSize === size ? styles.sizePillSelected : null,
              sizeStock[size] <= 0 ? styles.sizePillDisabled : null
            ]}
            onPress={() => {
              if (sizeStock[size] <= 0) {
                setSelectedSize(null);
                setValidationMessage(`O tamanho ${size} esta indisponivel. Escolha outro tamanho.`);
                return;
              }
              setSelectedSize(size);
              setValidationMessage(null);
            }}
          >
            <Text style={[styles.sizeText, selectedSize === size ? styles.sizeTextSelected : null]}>{size}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.screenDescription}>
        {!selectedSize
          ? "Selecione um tamanho para ver disponibilidade."
          : selectedSizeStock > 0
            ? `Estoque tam ${selectedSize}: ${selectedSizeStock}`
            : `Tam ${selectedSize} esgotado`}
      </Text>
      {validationMessage ? <Text style={styles.screenDescription}>{validationMessage}</Text> : null}

      <View style={styles.productActions}>
        <Pressable
          style={[
            styles.primaryActionButton,
            !selectedSize || selectedSizeStock <= 0 ? styles.primaryActionButtonDisabled : null
          ]}
          onPress={() => {
            if (!selectedSize) {
              setValidationMessage("Selecione um tamanho antes de adicionar ao carrinho.");
              return;
            }

            if (selectedSizeStock <= 0) {
              setValidationMessage(`O tamanho ${selectedSize} esta indisponivel. Escolha outro tamanho.`);
              return;
            }

            setValidationMessage(null);
            onAddToCart(
              product,
              selectedSize,
              canPersonalize && isPersonalizationOpen ? customNames : undefined,
              canPersonalize && isPersonalizationOpen ? customNumber ?? undefined : undefined
            );
          }}
        >
          <Text style={styles.primaryActionButtonText}>
            {!selectedSize ? "Selecionar tamanho" : selectedSizeStock > 0 ? "Adicionar ao carrinho" : "Tamanho indisponivel"}
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryActionButton} onPress={onGoCart}>
          <Text style={styles.secondaryActionButtonText}>Ir para carrinho</Text>
        </Pressable>
      </View>
    </View>
  );
}
