import { Pressable, Text, View } from "react-native";

import styles from "../../App.styles";
import type { AdminBlockedScreenProps } from "./types";

export function AdminBlockedScreen({ onBack, message }: AdminBlockedScreenProps) {
  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Area Admin</Text>
      <Text style={styles.screenDescription}>{message}</Text>
    </View>
  );
}
