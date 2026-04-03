import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Dispatch, SetStateAction } from "react";

import styles from "../../App.styles";

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
    if (!query) {
      return true;
    }
    return option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query);
  });

  return (
    <View>
      <Text style={styles.summaryKey}>{label}</Text>
      <Pressable
        style={styles.selectField}
        onPress={() => {
          setOpenSelectKey(isOpen ? null : selectKey);
          if (isOpen) {
            setSelectSearch((prev) => ({ ...prev, [selectKey]: "" }));
          }
        }}
      >
        <Text style={styles.selectFieldValue}>{valueLabel || "Selecione"}</Text>
        <Text style={styles.backLink}>{isOpen ? "Fechar" : "Abrir"}</Text>
      </Pressable>
      {isOpen ? (
        <View style={styles.selectDropdown}>
          <TextInput
            style={[styles.formInput, styles.selectSearchInput]}
            value={selectSearch[selectKey] ?? ""}
            onChangeText={(value) => setSelectSearch((prev) => ({ ...prev, [selectKey]: value }))}
            placeholder="Buscar..."
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
          />
          <ScrollView nestedScrollEnabled style={styles.selectDropdownScroll}>
            {filteredOptions.map((option) => (
              <Pressable
                key={`${selectKey}-${option.value}`}
                style={styles.selectOption}
                onPress={() => {
                  onSelect(option.value);
                  setOpenSelectKey(null);
                  setSelectSearch((prev) => ({ ...prev, [selectKey]: "" }));
                }}
              >
                <Text style={styles.selectOptionText}>{option.label}</Text>
              </Pressable>
            ))}
            {filteredOptions.length === 0 ? (
              <View style={styles.selectOption}>
                <Text style={styles.screenDescription}>Nenhum resultado</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
