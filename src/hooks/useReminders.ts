import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Reminder } from "../types";
import {
  getStoredReminders,
  updateReminderStatus,
  removeReminder,
} from "../services/reminderStorage";
import { calcularSegundosRestantes } from "../utils/dateHelpers";
import { useLocalNotifications } from "./useLocalNotifications";

export function useReminders(username: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const {
    programarNotificacion,
    cancelarNotificacion,
    cancelarMultiplesNotificaciones,
  } = useLocalNotifications();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadData = async () => {
        const stored = await getStoredReminders(username);
        if (isActive) {
          setReminders(stored);
        }
      };
      loadData();
      return () => {
        isActive = false;
      };
    }, [username]),
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      const target = reminders.find((r) => r.id === id);
      if (!target) return;

      let nextNotificationId: string | null | undefined = undefined;

      if (!target.completed) {
        if (target.notificationId) {
          await cancelarNotificacion(target.notificationId);
        }
        nextNotificationId = null;
      } else if (
        target.leadTimeSeconds !== undefined &&
        target.leadTimeSeconds !== null &&
        target.targetTimestamp
      ) {
        const secondsRemaining = calcularSegundosRestantes(
          target.targetTimestamp,
          Math.max(0, target.leadTimeSeconds),
        );
        if (secondsRemaining > 0) {
          nextNotificationId = await programarNotificacion(
            target.title,
            target.description,
            secondsRemaining,
          );
        }
      }

      const updated = await updateReminderStatus(
        id,
        username,
        nextNotificationId,
      );
      setReminders(updated);
    },
    [reminders, username, cancelarNotificacion, programarNotificacion],
  );

  const confirmAndDelete = useCallback(
    (id: string) => {
      Alert.alert(
        "Eliminar Recordatorio",
        "¿Deseas eliminar este recordatorio?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              const target = reminders.find((r) => r.id === id);
              if (target?.notificationId) {
                await cancelarNotificacion(target.notificationId);
              }
              const updated = await removeReminder(id, username);
              setReminders(updated);
            },
          },
        ],
      );
    },
    [reminders, username, cancelarNotificacion],
  );

  const cancelUserNotifications = useCallback(async () => {
    const activeIds = reminders
      .filter((r) => !r.completed && r.notificationId)
      .map((r) => r.notificationId);
    if (activeIds.length > 0) {
      await cancelarMultiplesNotificaciones(activeIds);
    }
  }, [reminders, cancelarMultiplesNotificaciones]);

  return {
    reminders,
    toggleComplete,
    confirmAndDelete,
    cancelUserNotifications,
  };
}
