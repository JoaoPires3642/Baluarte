import { Image, Pressable, Text, TextInput, View } from "react-native";

import { SkeletonCard } from "../../components/SkeletonCard";
import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { TeamScreenProps } from "./types";

const SIZE_OPTIONS = ["P", "M", "G", "GG"] as const;

export function TeamScreen({
  isLoading,
  team,
  products,
  searchQuery,
  selectedSize,
  inStockOnly,
  onSaleOnly,
  onChangeSearchQuery,
  onToggleSize,
  onToggleInStockOnly,
  onToggleOnSaleOnly,
  onClearFilters,
  onBack,
  onSelectProduct
}: TeamScreenProps & { isLoading?: boolean }) {
  if (!team) {
    return (
      <View style={styles.stackScreen}>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>Voltar</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Time nao encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar</Text>
      </Pressable>
      <Text style={styles.screenTitle}>{team.name}</Text>
      <Text style={styles.screenDescription}>{team.league ? `${team.league} • Produtos oficiais` : "Produtos oficiais"}</Text>

      <TextInput
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
        placeholder="Buscar por nome do produto"
        placeholderTextColor="#94a3b8"
        style={styles.formInput}
      />

      <View style={styles.chipsRowWrap}>
        <Pressable style={[styles.filterChip, inStockOnly ? styles.filterChipActive : null]} onPress={onToggleInStockOnly}>
          <Text style={[styles.filterChipText, inStockOnly ? styles.filterChipTextActive : null]}>Disponiveis</Text>
        </Pressable>
        <Pressable style={[styles.filterChip, onSaleOnly ? styles.filterChipActive : null]} onPress={onToggleOnSaleOnly}>
          <Text style={[styles.filterChipText, onSaleOnly ? styles.filterChipTextActive : null]}>Com desconto</Text>
        </Pressable>
        {SIZE_OPTIONS.map((size) => (
          <Pressable
            key={size}
            style={[styles.filterChip, selectedSize === size ? styles.filterChipActive : null]}
            onPress={() => onToggleSize(size)}
          >
            <Text style={[styles.filterChipText, selectedSize === size ? styles.filterChipTextActive : null]}>Tam {size}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={onClearFilters}>
        <Text style={styles.backLink}>Limpar filtros</Text>
      </Pressable>

      {!isLoading && products.length === 0 ? (
        <Text style={styles.screenDescription}>
          {searchQuery || selectedSize || inStockOnly || onSaleOnly
            ? "Nenhum modelo encontrado com os filtros aplicados."
            : "Nenhum modelo disponivel para este time no momento."}
        </Text>
      ) : null}

      <View style={styles.productGrid}>
        {isLoading ? (
          // Show skeleton loaders during loading
          Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} variant="product" />
          ))
        ) : (
          // Show actual products when loaded
          products.map((product) => (
            <Pressable key={product.id} style={styles.productCard} onPress={() => onSelectProduct(product.id)}>
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <View style={styles.productContent}>
                <Text style={styles.productTeam}>{product.team.name}</Text>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                {product.originalPrice ? (
                  <View style={styles.priceRow}>
                    <Text style={styles.productPriceOriginal}>{toBrl(product.originalPrice)}</Text>
                    <Text style={styles.productPrice}>{toBrl(product.price)}</Text>
                  </View>
                ) : (
                  <Text style={styles.productPrice}>{toBrl(product.price)}</Text>
                )}
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}
