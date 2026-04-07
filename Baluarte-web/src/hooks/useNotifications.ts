import { useState, useCallback } from "react";
import type { Notification } from "../components/admin/NotificationCenter";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
    duration: number = 5000
  ) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id,
      title,
      message,
      type,
      timestamp: new Date(),
      autoClose: true,
      duration
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, duration);
    }

    return id;
  }, [dismissNotification]);

  const success = useCallback((title: string, message: string) => {
    return addNotification(title, message, "success");
  }, [addNotification]);

  const error = useCallback((title: string, message: string) => {
    return addNotification(title, message, "error", 7000);
  }, [addNotification]);

  const info = useCallback((title: string, message: string) => {
    return addNotification(title, message, "info");
  }, [addNotification]);

  const warning = useCallback((title: string, message: string) => {
    return addNotification(title, message, "warning");
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    success,
    error,
    info,
    warning
  };
}
