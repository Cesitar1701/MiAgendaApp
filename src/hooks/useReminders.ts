import { useCallback } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  CategoryType,
  Reminder,
  ReminderContact,
  ReminderLocation,
} from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { useReminderStore } from "../store/useReminderStore";
import {
  calcularSegundosRestantes,
  formatDisplayDate,
  formatDisplayTime,
  toISODateString,
} from "../utils/dateHelpers";
import { useLocalNotifications } from "./useLocalNotifications";
import { useDeviceCalendar } from "./useDeviceCalendar";

export interface SaveReminderInput {
  title: string;
  description: string;
  category: CategoryType;
  selectedDate: Date;
  withNotification: boolean;
  leadTimeSeconds: number;
  syncWithCalendar: boolean;
  imageUri: string | null;
  location: ReminderLocation | null;
  contact: ReminderContact | null;
  editingReminder?: Reminder;
}

export function useReminders(usernameOverride?: string) {
  const authUser = useAuthStore((state) => state.user);
  const username = usernameOverride ?? authUser ?? undefined;

  const reminders = useReminderStore((state) => state.reminders);
  const loadReminders = useReminderStore((state) => state.loadReminders);
  const addReminder = useReminderStore((state) => state.addReminder);
  const updateReminder = useReminderStore((state) => state.updateReminder);
  const deleteReminder = useReminderStore((state) => state.deleteReminder);

  const {
    programarNotificacion,
    cancelarNotificacion,
    cancelarMultiplesNotificaciones,
    sincronizarBadgePendientes,
  } = useLocalNotifications();

  const {
    crearEventoCalendario,
    actualizarEventoCalendario,
    eliminarEventoCalendario,
  } = useDeviceCalendar();

  useFocusEffect(
    useCallback(() => {
      Promise.resolve(loadReminders(username))
        .then(() => {
          sincronizarBadgePendientes?.(username);
        })
        .catch(() => {});
    }, [username, loadReminders, sincronizarBadgePendientes]),
  );

  const saveOrUpdateReminder = useCallback(
    async (input: SaveReminderInput): Promise<boolean> => {
      const {
        title,
        description,
        category,
        selectedDate,
        withNotification,
        leadTimeSeconds,
        syncWithCalendar,
        imageUri,
        location,
        contact,
        editingReminder,
      } = input;

      const isEditing = Boolean(editingReminder);
      const reminderId = editingReminder
        ? editingReminder.id
        : Date.now().toString();
      const targetUsername = username ?? editingReminder?.username;
      const formattedDate = formatDisplayDate(selectedDate);
      const formattedTime = formatDisplayTime(selectedDate);

      let notifId: string | null = null;
      if (withNotification) {
        const secondsRemaining = calcularSegundosRestantes(
          selectedDate.getTime(),
          leadTimeSeconds,
        );

        if (secondsRemaining <= 0) {
          Alert.alert(
            "Hora no válida",
            "La hora programada para la notificación ya ha pasado. Por favor selecciona una fecha posterior.",
          );
          return false;
        }

        if (editingReminder?.notificationId) {
          await cancelarNotificacion(editingReminder.notificationId);
        }

        if (!editingReminder?.completed) {
          notifId = await programarNotificacion(
            title.trim(),
            description.trim(),
            secondsRemaining,
            {
              category,
              reminderId,
              username: targetUsername,
              targetDate: formattedDate,
              targetTime: formattedTime,
              leadTimeSeconds,
            },
          );

          if (!notifId) {
            return false;
          }
        }
      } else if (editingReminder?.notificationId) {
        await cancelarNotificacion(editingReminder.notificationId);
      }

      // Sincronización con el calendario nativo del teléfono
      let calendarEventId: string | undefined =
        editingReminder?.calendarEventId;

      if (syncWithCalendar) {
        const eventPayload = {
          title: title.trim(),
          description: description.trim(),
          startDate: selectedDate,
          endDate: new Date(selectedDate.getTime() + 60 * 60 * 1000),
          location: location ?? undefined,
          leadTimeSeconds: withNotification ? leadTimeSeconds : null,
        };

        if (calendarEventId) {
          const updated = await actualizarEventoCalendario(
            calendarEventId,
            eventPayload,
          );
          if (!updated) {
            const newId = await crearEventoCalendario(eventPayload);
            calendarEventId = newId ?? calendarEventId;
          }
        } else {
          const createdId = await crearEventoCalendario(eventPayload);
          if (createdId) {
            calendarEventId = createdId;
          }
        }
      } else if (calendarEventId) {
        await eliminarEventoCalendario(calendarEventId);
        calendarEventId = undefined;
      }

      const reminderPayload: Reminder = {
        id: reminderId,
        username: targetUsername,
        title: title.trim(),
        description: description.trim(),
        category,
        date: formattedDate,
        isoDate: toISODateString(selectedDate),
        time: formattedTime,
        targetTimestamp: selectedDate.getTime(),
        leadTimeSeconds: withNotification ? leadTimeSeconds : null,
        completed: editingReminder ? editingReminder.completed : false,
        notificationId: notifId,
        imageUri: imageUri ?? null,
        location: location ?? undefined,
        contact: contact ?? undefined,
        calendarEventId: calendarEventId ?? undefined,
      };

      const saved = isEditing
        ? await updateReminder(reminderPayload, targetUsername)
        : await addReminder(reminderPayload, targetUsername);

      if (saved) {
        await sincronizarBadgePendientes?.(targetUsername).catch(() => {});
        return true;
      }

      Alert.alert(
        "Error",
        isEditing
          ? "No se pudo actualizar el recordatorio."
          : "No se pudo guardar el recordatorio.",
      );
      return false;
    },
    [
      username,
      cancelarNotificacion,
      programarNotificacion,
      actualizarEventoCalendario,
      crearEventoCalendario,
      eliminarEventoCalendario,
      updateReminder,
      addReminder,
      sincronizarBadgePendientes,
    ],
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
              if (target?.calendarEventId) {
                await eliminarEventoCalendario(target.calendarEventId).catch(
                  () => false,
                );
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
      eliminarEventoCalendario,
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
    saveOrUpdateReminder,
    toggleComplete,
    confirmAndDelete,
    cancelUserNotifications,
  };
}
