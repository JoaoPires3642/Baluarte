import { Text, TextInput, View } from "react-native";
import type { Dispatch, SetStateAction } from "react";

import styles from "../../App.styles";
import type { ValidSize } from "../../pages/admin/types";
import type { ProductFormDraft } from "./ProductFormTypes";

type ProductFormStepTwoProps = {
  draft: ProductFormDraft;
  setDraft: Dispatch<SetStateAction<ProductFormDraft>>;
  sizes: ValidSize[];
  selectPrefix: "create" | "edit";
};

export function ProductFormStepTwo({ draft, setDraft, sizes, selectPrefix }: ProductFormStepTwoProps) {
  return (
    <>
      <Text style={styles.summaryKey}>Preco cheio</Text>
      <TextInput
        style={styles.formInput}
        value={draft.price}
        onChangeText={(value) => setDraft((prev) => ({ ...prev, price: value }))}
        placeholder="Preco cheio"
        placeholderTextColor="#9ca3af"
        keyboardType="decimal-pad"
      />

      <Text style={styles.summaryKey}>Preco com desconto (opcional)</Text>
      <TextInput
        style={styles.formInput}
        value={draft.discountPrice}
        onChangeText={(value) => setDraft((prev) => ({ ...prev, discountPrice: value }))}
        placeholder="Preco com desconto (opcional)"
        placeholderTextColor="#9ca3af"
        keyboardType="decimal-pad"
      />

      <Text style={styles.summaryKey}>Estoque por tamanho</Text>
      <View style={styles.chipsRowWrap}>
        {sizes.map((size) => (
          <View key={`${selectPrefix}-${size}`} style={styles.shippingOption}>
            <Text style={styles.shippingLabel}>{size}</Text>
            <TextInput
              style={styles.formInput}
              value={draft.stockBySize[size]}
              onChangeText={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  stockBySize: { ...prev.stockBySize, [size]: value.replace(/[^0-9]/g, "") }
                }))
              }
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
          </View>
        ))}
      </View>
    </>
  );
}
