import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import styles from "../../App.styles";
import { ErrorBanner } from "./ErrorBanner";

type SimpleFormModalProps = {
  visible: boolean;
  title: string;
  errors: string[];
  submitLabel: string;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
};

export function SimpleFormModal({
  visible,
  title,
  errors,
  submitLabel,
  isLoading,
  onClose,
  onSubmit,
  children
}: SimpleFormModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { maxHeight: "90%" }]}>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.backLink}>Fechar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <ErrorBanner errors={errors} visible={errors.length > 0} />
            {children}
          </ScrollView>

          <View style={styles.inlineActionRow}>
            <Pressable style={styles.primaryActionButton} onPress={onSubmit} disabled={isLoading}>
              <Text style={styles.primaryActionButtonText}>{isLoading ? "Salvando..." : submitLabel}</Text>
            </Pressable>
            <Pressable style={styles.secondaryActionButton} onPress={onClose} disabled={isLoading}>
              <Text style={styles.secondaryActionButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
