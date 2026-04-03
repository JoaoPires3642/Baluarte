import { Animated, Easing, View } from "react-native";
import { useEffect, useRef } from "react";
import styles from "../App.styles";

interface SkeletonCardProps {
  variant?: "product" | "team" | "category";
  width?: number;
  height?: number;
}

export function SkeletonCard({ variant = "product", width, height }: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  if (variant === "product") {
    return (
      <Animated.View style={[styles.productCard, { opacity }]}>
        <View style={[styles.productImage, { backgroundColor: "#e0e0e0" }]} />
        <View style={styles.productContent}>
          <View style={{ height: 12, backgroundColor: "#e0e0e0", marginBottom: 8, borderRadius: 4 }} />
          <View style={{ height: 14, backgroundColor: "#e0e0e0", marginBottom: 8, borderRadius: 4, width: "80%" }} />
          <View style={{ height: 10, backgroundColor: "#e0e0e0", borderRadius: 4, width: "60%" }} />
        </View>
      </Animated.View>
    );
  }

  if (variant === "team") {
    return (
      <Animated.View style={[styles.teamCard, { opacity }]}>
        <View style={[styles.teamLogo, { backgroundColor: "#e0e0e0" }]} />
        <View style={{ height: 14, backgroundColor: "#e0e0e0", marginTop: 8, borderRadius: 4 }} />
        <View style={{ height: 10, backgroundColor: "#e0e0e0", marginTop: 4, borderRadius: 4, width: "70%" }} />
      </Animated.View>
    );
  }

  if (variant === "category") {
    return (
      <Animated.View style={[styles.categoryCard, { opacity }]}>
        <View style={[styles.categoryImage, { backgroundColor: "#e0e0e0" }]} />
      </Animated.View>
    );
  }

  return null;
}
