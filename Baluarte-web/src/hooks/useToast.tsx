import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text } from "react-native";
import styles from "../App.styles";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

export const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success", duration = 3000) => {
    const id = `toast-${Date.now()}`;
    const newToast: ToastMessage = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
    }

    timeoutRefs.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timeoutRefs.current[id];
    }, duration);
  }, []);

  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      Object.values(timeouts).forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <View style={styles.toastContainer}>
        {toasts.map((toast) => (
          <View key={toast.id} style={[
            styles.toastBox,
            toast.type === "success" && styles.toastSuccess,
            toast.type === "error" && styles.toastError,
            toast.type === "info" && styles.toastInfo
          ]}>
            <Text style={styles.toastIcon}>
              {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
            </Text>
            <Text style={styles.toastMessage}>{toast.message}</Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
