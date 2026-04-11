import { TextInput, View, Text, StyleSheet, TextInputProps, ViewProps } from "react-native";

type InputProps = {
  className?: string;
} & TextInputProps;

export function Input({ className, placeholder, ...props }: InputProps) {
  return (
    <TextInput
      style={[styles.input, className]}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  );
}

type LabelProps = {
  className?: string;
  children: string;
} & ViewProps;

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <Text style={[styles.label, className]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#1f2937",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
});