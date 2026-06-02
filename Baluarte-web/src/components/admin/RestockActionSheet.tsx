import { Modal, Pressable, Text, View } from "react-native";

import styles from "../../App.styles";
import type { ValidSize } from "../../pages/admin/types";

type RestockSize = ValidSize | "ALL";

type RestockActionSheetProps = {
  visible: boolean;
  productName: string;
  selectedSize: RestockSize;
  onSelectSize: (size: RestockSize) => void;
  onRestockDelta: (delta: number) => void;
  onClose: () => void;
};

const RESTOCK_SIZES: RestockSize[] = ["ALL", "P", "M", "G", "GG", "G1", "G2", "G3", "G4"];
const RESTOCK_DELTAS = [1, 3, 5, 10];

export function RestockActionSheet({
  visible,
  productName,
  selectedSize,
  onSelectSize,
  onRestockDelta,
  onClose
}: RestockActionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryTitle}>Reposicao granular</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.backLink}>Fechar</Text>
            </Pressable>
          </View>

          <Text style={styles.screenDescription}>Produto: {productName}</Text>

          <Text style={styles.summaryKey}>Tamanho</Text>
          <View style={styles.inlineActionRow}>
            {RESTOCK_SIZES.map((size) => (
              <Pressable
                key={size}
                style={selectedSize === size ? styles.primaryActionButton : styles.secondaryActionButton}
                onPress={() => onSelectSize(size)}
              >
                <Text style={selectedSize === size ? styles.primaryActionButtonText : styles.secondaryActionButtonText}>
                  {size === "ALL" ? "Todos" : size}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.summaryKey}>Quantidade</Text>
          <View style={styles.inlineActionRow}>
            {RESTOCK_DELTAS.map((delta) => (
              <Pressable key={delta} style={styles.secondaryActionButton} onPress={() => onRestockDelta(delta)}>
                <Text style={styles.secondaryActionButtonText}>+{delta}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
