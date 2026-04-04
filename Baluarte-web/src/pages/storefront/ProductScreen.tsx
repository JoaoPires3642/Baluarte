import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { Size } from "../../lib/types";
import type { ProductScreenProps } from "./types";

export function ProductScreen({ product, onBackToTeam, onBackHome, onAddToCart, onGoCart }: ProductScreenProps) {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

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
  }, [product?.id]);

  const selectedSizeStock = selectedSize ? sizeStock[selectedSize] ?? 0 : 0;
  const canPersonalize = Boolean(product?.customizationEnabled && product?.customizationTemplatePng);

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

      <Image source={{ uri: product.image }} style={styles.detailImage} />
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
            onPress={() => setValidationMessage("Personalizacao sera liberada na proxima etapa do checkout.")}
          >
            <Text style={styles.secondaryActionButtonText}>Personalizar camisa</Text>
          </Pressable>
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
            onAddToCart(product, selectedSize);
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
