import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Dispatch, SetStateAction } from "react";
import { Label, Input } from "../shadcn";

type ProductOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  valueLabel: string;
  selectKey: string;
  options: ProductOption[];
  onSelect: (value: string) => void;
  openSelectKey: string | null;
  setOpenSelectKey: Dispatch<SetStateAction<string | null>>;
  selectSearch: Record<string, string>;
  setSelectSearch: Dispatch<SetStateAction<Record<string, string>>>;
};

export function SelectField({
  label,
  valueLabel,
  selectKey,
  options,
  onSelect,
  openSelectKey,
  setOpenSelectKey,
  selectSearch,
  setSelectSearch
}: SelectFieldProps) {
  const isOpen = openSelectKey === selectKey;
  const query = (selectSearch[selectKey] ?? "").trim().toLowerCase();
  const filteredOptions = options.filter((option) => {
    if (!query) return true;
    return option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query);
  });

  return (
    <View style={styles.container}>
      <Label>{label}</Label>
      <Pressable
        style={styles.selectButton}
        onPress={() => {
          setOpenSelectKey(isOpen ? null : selectKey);
          if (isOpen) {
            setSelectSearch((prev) => ({ ...prev, [selectKey]: "" }));
          }
        }}
      >
        <Text style={[styles.selectValue, !valueLabel && styles.placeholder]}>
          {valueLabel || "Selecione..."}
        </Text>
        <Text style={styles.chevron}>{isOpen ? "▲" : "▼"}</Text>
      </Pressable>
      
      {isOpen && (
        <View style={styles.dropdown}>
          <Input
            style={styles.searchInput}
            value={selectSearch[selectKey] ?? ""}
            onChangeText={(value) => setSelectSearch((prev) => ({ ...prev, [selectKey]: value }))}
            placeholder="Buscar..."
            autoCapitalize="none"
          />
          <ScrollView nestedScrollEnabled style={styles.optionsList}>
            {filteredOptions.map((option) => (
              <Pressable
                key={`${selectKey}-${option.value}`}
                style={styles.option}
                onPress={() => {
                  onSelect(option.value);
                  setOpenSelectKey(null);
                  setSelectSearch((prev) => ({ ...prev, [selectKey]: "" }));
                }}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}
            {filteredOptions.length === 0 && (
              <Text style={styles.noResults}>Nenhum resultado</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginBottom: 12,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  selectValue: {
    fontSize: 16,
    color: "#1f2937",
  },
  placeholder: {
    color: "#9ca3af",
  },
  chevron: {
    fontSize: 12,
    color: "#6b7280",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginTop: 4,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  optionsList: {
    maxHeight: 200,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  optionText: {
    fontSize: 16,
    color: "#374151",
  },
  noResults: {
    padding: 12,
    color: "#6b7280",
    textAlign: "center",
  },
});