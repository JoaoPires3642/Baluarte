import { View, Text } from "react-native";
import styles from "../../App.styles";

interface ErrorBannerProps {
  errors: string[];
  visible: boolean;
}

export function ErrorBanner({ errors, visible }: ErrorBannerProps) {
  if (!visible || errors.length === 0) {
    return null;
  }

  return (
    <View style={[styles.errorBannerContainer]}>
      {errors.map((error, index) => (
        <View key={`error-${index}`} style={styles.errorBannerRow}>
          <Text style={styles.errorBannerIcon}>❌</Text>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ))}
    </View>
  );
}
