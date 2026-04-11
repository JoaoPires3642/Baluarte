import { View, Text, StyleSheet, ViewProps } from "react-native";

type AlertProps = {
  variant?: "default" | "destructive" | "success";
} & ViewProps;

export function Alert({ variant = "default", children, style, ...props }: AlertProps) {
  return (
    <View style={[styles.alert, styles[variant], style]} {...props}>
      {children}
    </View>
  );
}

export function AlertTitle({ children, style, ...props }: ViewProps) {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

export function AlertDescription({ children, style, ...props }: ViewProps) {
  return (
    <Text style={[styles.description, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  alert: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  default: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  destructive: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  success: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#4b5563",
  },
});