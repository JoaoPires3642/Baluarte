import { Text, View } from "react-native";

import styles from "../../App.styles";
import type { ProductFormStep } from "./ProductFormTypes";

type ProductFormProgressBarProps = {
  step: ProductFormStep;
};

const LABELS: Array<{ step: ProductFormStep; label: string }> = [
  { step: 1, label: "Informacoes" },
  { step: 2, label: "Preco e estoque" },
  { step: 3, label: "Imagens" }
];

export function ProductFormProgressBar({ step }: ProductFormProgressBarProps) {
  return (
    <View style={styles.inlineActionRow}>
      {LABELS.map((item) => {
        const textStyle = item.step === step ? styles.stepActive : styles.stepDone;
        return (
          <Text key={item.step} style={textStyle}>
            {item.step}/3 {item.label}
          </Text>
        );
      })}
    </View>
  );
}
