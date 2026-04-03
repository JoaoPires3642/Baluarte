import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import styles from "../../App.styles";
import { ErrorBanner } from "./ErrorBanner";
import { ProductFormProgressBar } from "./ProductFormProgressBar";
import type { ProductFormStep } from "./ProductFormTypes";

type ProductFormModalProps = {
  visible: boolean;
  title: string;
  step: ProductFormStep;
  errors: string[];
  windowHeight: number;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
  children: ReactNode;
};

export function ProductFormModal({
  visible,
  title,
  step,
  errors,
  windowHeight,
  onClose,
  onBack,
  onNext,
  onSubmit,
  submitLabel,
  submitDisabled,
  children
}: ProductFormModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { maxHeight: Math.max(500, windowHeight * 0.9) }]}>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.backLink}>Fechar</Text>
            </Pressable>
          </View>

          <Text style={styles.screenDescription}>Etapa {step} de 3</Text>
          <ProductFormProgressBar step={step} />

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <ErrorBanner errors={errors} visible={errors.length > 0} />
            {children}
          </ScrollView>

          <View style={styles.inlineActionRow}>
            {step > 1 ? (
              <Pressable style={styles.secondaryActionButton} onPress={onBack}>
                <Text style={styles.secondaryActionButtonText}>Voltar</Text>
              </Pressable>
            ) : null}

            {step < 3 ? (
              <Pressable style={styles.primaryActionButton} onPress={onNext}>
                <Text style={styles.primaryActionButtonText}>Proxima etapa</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.primaryActionButton} onPress={onSubmit} disabled={submitDisabled}>
                <Text style={styles.primaryActionButtonText}>{submitLabel}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
