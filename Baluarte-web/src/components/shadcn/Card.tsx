import { View, StyleSheet, ViewProps } from "react-native";

type CardProps = {
  className?: string;
} & ViewProps;

export function Card({ className, children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, className, style]} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ className, children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.cardHeader, className, style]} {...props}>
      {children}
    </View>
  );
}

export function CardTitle({ className, children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.cardTitle, className, style]} {...props}>
      {children}
    </View>
  );
}

export function CardDescription({ className, children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.cardDescription, className, style]} {...props}>
      {children}
    </View>
  );
}

export function CardContent({ className, children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.cardContent, className, style]} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ className, children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.cardFooter, className, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  cardContent: {
    padding: 16,
    paddingTop: 8,
  },
  cardFooter: {
    padding: 16,
    paddingTop: 8,
    flexDirection: "row",
    gap: 12,
  },
});