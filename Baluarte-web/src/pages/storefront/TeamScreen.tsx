import { Image, Pressable, Text, View } from "react-native";

import { SkeletonCard } from "../../components/SkeletonCard";
import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { TeamScreenProps } from "./types";

export function TeamScreen({ isLoading, team, products, onBack, onSelectProduct }: TeamScreenProps & { isLoading?: boolean }) {
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
