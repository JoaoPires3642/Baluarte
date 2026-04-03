import { View, Text, Pressable, Animated } from "react-native";
import { useEffect, useRef, useState } from "react";

import styles from "../../App.styles";

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
};

type NotificationCenterProps = {
  notifications: Notification[];
  onDismiss: (id: string) => void;
};

export function NotificationCenter({ notifications, onDismiss }: NotificationCenterProps) {
  const [visible, setVisible] = useState(notifications.length > 0);
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [visible, fadeAnim]);

  if (notifications.length === 0) {
    return null;
  }

  const typeConfig: Record<string, { bg: string; border: string; icon: string }> = {
    success: { bg: "#f0fdf4", border: "#86efac", icon: "✅" },
    error: { bg: "#fef2f2", border: "#fca5a5", icon: "❌" },
    info: { bg: "#f0f9ff", border: "#93c5fd", icon: "ℹ️" },
    warning: { bg: "#fffbeb", border: "#fde047", icon: "⚠️" }
  };

  const latestNotification = notifications[notifications.length - 1];
  const config = typeConfig[latestNotification.type];

  return (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <Pressable onPress={() => onDismiss(latestNotification.id)}>
        <View
          style={{
            backgroundColor: config.bg,
            borderLeftWidth: 4,
            borderLeftColor: config.border,
            padding: 12,
            borderRadius: 6,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8
          }}
        >
          <Text style={{ fontSize: 20 }}>{config.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "600", fontSize: 13, marginBottom: 2 }}>{latestNotification.title}</Text>
            <Text style={styles.screenDescription}>{latestNotification.message}</Text>
          </View>
          <Pressable onPress={() => onDismiss(latestNotification.id)}>
            <Text style={{ fontSize: 16, color: "#6b7280" }}>✕</Text>
          </Pressable>
        </View>
      </Pressable>

      {notifications.length > 1 && (
        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, textAlign: "center" }}>
          +{notifications.length - 1} mais notificaçõ(es)
        </Text>
      )}
    </Animated.View>
  );
}
