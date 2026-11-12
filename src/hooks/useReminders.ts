import { useCallback } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Reminder } from "../types";
import { useReminderStore } from "../store/useReminderStore";
import { calcularSegundosRestantes } from "../utils/dateHelpers";
import { useLocalNotifications } from "./useLocalNotifications";

export function useReminders(username: string) {
  const reminders = useReminderStore((state) => state.reminders);
  const loadReminders = useReminderStore((state) => state.loadReminders);
  const updateReminder = useReminderStore((state) => state.updateReminder);
  const deleteReminder = useReminderStore((state) => state.deleteReminder);

  const {
    programarNotificacion,
    cancelarNotificacion,
    cancelarMultiplesNotificaciones,
    sincronizarBadgePendientes,
  } = useLocalNotifications();

  useFocusEffect(
    useCallback(() => {
      Promise.resolve(loadReminders(username))
        .then(() => {
          sincronizarBadgePendientes?.(username);
        })
        .catch(() => {});
    }, [username, loadReminders, sincronizarBadgePendientes]),
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
            {
              category: target.category,
              reminderId: target.id,
              username,
              targetDate: target.date,
              targetTime: target.time,
              leadTimeSeconds: target.leadTimeSeconds,
            },
          );
        }
      }

      const nextCompleted = !target.completed;
      const updatedReminder: Reminder = {
        ...target,
        completed: nextCompleted,
        notificationId:
          nextNotificationId !== undefined
            ? nextNotificationId
            : nextCompleted
              ? null
              : target.notificationId,
      };

      await updateReminder(updatedReminder, username);
      await sincronizarBadgePendientes?.(username);
    },
    [
      reminders,
      username,
      cancelarNotificacion,
      programarNotificacion,
      updateReminder,
      sincronizarBadgePendientes,
    ],
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
              await deleteReminder(id, username);
              await sincronizarBadgePendientes?.(username);
            },
          },
        ],
      );
    },
    [
      reminders,
      username,
      cancelarNotificacion,
      deleteReminder,
      sincronizarBadgePendientes,
    ],
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
