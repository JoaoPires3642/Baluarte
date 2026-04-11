import { ComponentProps } from "react";
import { Pressable, Text, StyleSheet } from "react-native";

type ButtonProps = {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
} & ComponentProps<typeof Pressable>;

const variants = {
  default: {
    backgroundColor: "#2563eb",
  },
  destructive: {
    backgroundColor: "#dc2626",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  secondary: {
    backgroundColor: "#f3f4f6",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  link: {
    backgroundColor: "transparent",
  },
};

const sizes = {
  default: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
  },
  icon: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
};

export function Button({
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variants[variant],
        sizes[size],
        pressed && styles.pressed,
        className,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          { fontSize: sizes[size].fontSize },
          variant === "default" && styles.textDefault,
          variant === "destructive" && styles.textDestructive,
          variant === "outline" && styles.textOutline,
          variant === "secondary" && styles.textSecondary,
          variant === "ghost" && styles.textGhost,
          variant === "link" && styles.textLink,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontWeight: "600",
  },
  textDefault: {
    color: "#ffffff",
  },
  textDestructive: {
    color: "#ffffff",
  },
  textOutline: {
    color: "#374151",
  },
  textSecondary: {
    color: "#374151",
  },
  textGhost: {
    color: "#374151",
  },
  textLink: {
    color: "#2563eb",
  },
});