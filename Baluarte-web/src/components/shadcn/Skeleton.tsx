import { View, StyleSheet, ViewProps } from "react-native";

type SkeletonProps = {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  className?: string;
} & ViewProps;

export function Skeleton({ variant = "text", className, style, ...props }: SkeletonProps) {
  return (
    <View style={[styles[variant], className, style]} {...props} />
  );
}

const styles = StyleSheet.create({
  text: {
    height: 16,
    borderRadius: 4,
  },
  circular: {
    borderRadius: 9999,
  },
  rectangular: {
    borderRadius: 0,
  },
  rounded: {
    borderRadius: 8,
  },
});