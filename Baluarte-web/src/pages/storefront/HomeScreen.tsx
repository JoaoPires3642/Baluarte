import { Image, Pressable, Text, View } from "react-native";

import { SkeletonCard } from "../../components/SkeletonCard";
import styles from "../../App.styles";
import { homeCategories } from "../../lib/home-categories";
import { toBrl } from "../../lib/format";
import type { HomeScreenProps } from "./types";

export function HomeScreen({ isLoading, featuredProducts, onOpenCategory, onOpenProduct }: HomeScreenProps & { isLoading?: boolean }) {
  return (
    <>
      <View style={styles.heroSection}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80" }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.badge}>Colecao 2024</Text>
          <Text style={styles.title}>Vista a camisa</Text>
          <Text style={styles.titleAccent}>do seu time</Text>
          <Text style={styles.subtitle}>
            Camisas oficiais dos maiores times do mundo. Qualidade premium, entrega rapida.
          </Text>
          <View style={styles.heroButtons}>
            <Pressable style={styles.primaryButton} onPress={() => onOpenCategory("nacionais")}>
              <Text style={styles.primaryButtonText}>Comprar Agora</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => onOpenCategory("selecoes")}>
              <Text style={styles.secondaryButtonText}>Ver Selecoes</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        {homeCategories.map((category) => (
          <Pressable 
            key={category.slug} 
            style={[styles.categoryCard, { borderLeftColor: category.color, borderLeftWidth: 6 }]} 
            onPress={() => onOpenCategory(category.slug)}
          >
            <Image source={{ uri: category.image }} style={styles.categoryImage} />
            <View style={styles.categoryContent}>
              <Text style={{ fontSize: 28, marginBottom: 4 }}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryLink}>Ver Colecao →</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionMuted}>
        <View style={styles.featuredHeader}>
          <View>
            <Text style={styles.featuredLabel}>Em destaque</Text>
            <Text style={styles.sectionTitle}>Mais Vendidos</Text>
          </View>
          <Text style={styles.featuredLink}>Ver Todos</Text>
        </View>

        <View style={styles.productGrid}>
          {isLoading ? (
            // Show skeleton loaders during loading
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} variant="product" />
            ))
          ) : (
            // Show actual products when loaded
            featuredProducts.map((product) => (
              <Pressable key={product.id} style={styles.productCard} onPress={() => onOpenProduct(product.id)}>
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
    </>
  );
}
