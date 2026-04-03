import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { Size } from "../../lib/types";
import type { ProductScreenProps } from "./types";

export function ProductScreen({ product, onBackToTeam, onBackHome, onAddToCart, onGoCart }: ProductScreenProps) {
  const [selectedSize, setSelectedSize] = useState<Size>("M");

  const sizeStock = useMemo(() => {
    if (!product) {
      return { P: 0, M: 0, G: 0, GG: 0 };
    }
    return product.sizes.reduce<Record<Size, number>>((acc, size) => {
      const available = product.stockBySize?.[size];
      acc[size] = Number.isFinite(available) ? Math.max(0, available as number) : (product.inStock ? 999 : 0);
      return acc;
    }, { P: 0, M: 0, G: 0, GG: 0 });
  }, [product]);

  useEffect(() => {
    if (!product) {
      return;
    }
    if (sizeStock[selectedSize] > 0) {
      return;
    }
    const fallback = product.sizes.find((size) => sizeStock[size] > 0);
    if (fallback) {
      setSelectedSize(fallback);
    }
  }, [product, selectedSize, sizeStock]);

  const selectedSizeStock = sizeStock[selectedSize] ?? 0;

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
                return;
              }
              setSelectedSize(size);
            }}
          >
            <Text style={[styles.sizeText, selectedSize === size ? styles.sizeTextSelected : null]}>{size}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.screenDescription}>
        {selectedSizeStock > 0 ? `Estoque tam ${selectedSize}: ${selectedSizeStock}` : `Tam ${selectedSize} esgotado`}
      </Text>

      <View style={styles.productActions}>
        <Pressable
          style={[styles.primaryActionButton, selectedSizeStock <= 0 ? styles.primaryActionButtonDisabled : null]}
          onPress={() => onAddToCart(product, selectedSize)}
          disabled={selectedSizeStock <= 0}
        >
          <Text style={styles.primaryActionButtonText}>{selectedSizeStock > 0 ? "Adicionar ao carrinho" : "Tamanho indisponivel"}</Text>
        </Pressable>
        <Pressable style={styles.secondaryActionButton} onPress={onGoCart}>
          <Text style={styles.secondaryActionButtonText}>Ir para carrinho</Text>
        </Pressable>
      </View>
    </View>
  );
}
