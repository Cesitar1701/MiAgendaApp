import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";

// Nota de Arquitectura: Se importan submódulos específicos de expo-notifications/build/
// para evitar que Expo Go (SDK 53+) cargue el módulo de Remote Push Notifications
// que emite advertencias al no usarse en notificaciones locales.
import { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
import { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from "expo-notifications/build/NotificationsEmitter";
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications/build/NotificationPermissions";
import { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
import { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";
import { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
import { SchedulableTriggerInputTypes } from "expo-notifications/build/Notifications.types";
import { setNotificationCategoryAsync } from "expo-notifications/build/setNotificationCategoryAsync";
import { setBadgeCountAsync } from "expo-notifications/build/setBadgeCountAsync";
import { dismissNotificationAsync } from "expo-notifications/build/dismissNotificationAsync";

import {
  requestPermissionSafely,
  showPermissionAlert,
} from "../utils/permissionHelpers";
import { CategoryType, Reminder } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { useReminderStore } from "../store/useReminderStore";
import { getStoredReminders } from "../services/reminderStorage";

export const ANDROID_CHANNEL_ID = "recordatorios";
export const REMINDER_CATEGORY_ID = "reminder_actions";
export const ACTION_COMPLETE_REMINDER = "COMPLETE_REMINDER_ACTION";

export const CATEGORY_EMOJIS: Record<CategoryType, string> = {
  urgente: "🚨",
  trabajo: "💼",
  salud: "💊",
  personal: "👤",
};

export interface ScheduleNotificationOptions {
  category?: CategoryType;
  reminderId?: string;
  username?: string;
  targetDate?: string;
  targetTime?: string;
  leadTimeSeconds?: number | null;
}

export interface NotificationResponsePayload {
  actionIdentifier?: string;
  notification?: {
    request?: {
      identifier?: string;
      content?: {
        data?: Record<string, unknown>;
      };
    };
  };
}

export function formatearTituloNotificacion(
  titulo: string,
  category?: CategoryType,
): string {
  const emoji = category ? CATEGORY_EMOJIS[category] || "⏰" : "⏰";
  return `${emoji} ${titulo}`;
}

export function formatearCuerpoNotificacion(
  descripcion?: string,
  fecha?: string,
  hora?: string,
): string {
  const parts: string[] = [];
  if (fecha || hora) {
    const when = [fecha, hora].filter(Boolean).join(", ");
    parts.push(`📅 ${when}`);
  }
  if (descripcion && descripcion.trim()) {
    parts.push(descripcion.trim());
  }
  return parts.length > 0 ? parts.join(" • ") : "Tienes una tarea programada.";
}

export async function registrarCategoriaNotificaciones(): Promise<void> {
  try {
    await setNotificationCategoryAsync(REMINDER_CATEGORY_ID, [
      {
        identifier: ACTION_COMPLETE_REMINDER,
        buttonTitle: "✔ Completar tarea",
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  } catch {
    // Entorno sin soporte de categorías o en testing
  }
}

export async function actualizarBadgeCount(count: number): Promise<boolean> {
  try {
    return await setBadgeCountAsync(Math.max(0, count));
  } catch {
    return false;
  }
}

export async function sincronizarBadgePendientes(
  username?: string,
): Promise<number> {
  try {
    const store = useReminderStore.getState();
    const targetUser = username ?? useAuthStore.getState().user ?? undefined;
    let list = store.reminders;
    if (!list || list.length === 0) {
      list = await getStoredReminders(targetUser);
    }
    const pendientes = list.filter((r) => !r.completed).length;
    await setBadgeCountAsync(pendientes);
    return pendientes;
  } catch {
    return 0;
  }
}

export async function marcarRecordatorioCompletadoPorNotificacion(
  reminderId: string,
  username?: string,
): Promise<boolean> {
  try {
    const store = useReminderStore.getState();
    let target = store.reminders.find((r) => r.id === reminderId);
    const targetUser =
      username ?? target?.username ?? useAuthStore.getState().user ?? undefined;

    if (!target) {
      const stored = await getStoredReminders(targetUser);
      target = stored.find((r) => r.id === reminderId);
    }

    if (target && !target.completed) {
      const updatedReminder: Reminder = {
        ...target,
        completed: true,
        notificationId: null,
      };
      const ok = await store.updateReminder(updatedReminder, targetUser);
      if (ok) {
        await sincronizarBadgePendientes(targetUser);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.warn("[LocalNotif] Error al marcar recordatorio completado:", error);
    return false;
  }
}

export async function handleNotificationResponse(
  response: NotificationResponsePayload,
): Promise<void> {
  try {
    const actionIdentifier = response?.actionIdentifier;
    const notification = response?.notification;
    if (actionIdentifier === ACTION_COMPLETE_REMINDER) {
      const data = notification?.request?.content?.data;
      const reminderId =
        typeof data?.reminderId === "string" ? data.reminderId : undefined;
      const username =
        typeof data?.username === "string" ? data.username : undefined;

      if (reminderId) {
        await marcarRecordatorioCompletadoPorNotificacion(reminderId, username);
      }
      if (notification?.request?.identifier) {
        await dismissNotificationAsync(notification.request.identifier).catch(
          () => {},
        );
      }
    }
  } catch (err) {
    console.warn("[LocalNotif] Error en handleNotificationResponse:", err);
  }
}

/**
 * Configura el handler y listeners de notificaciones dentro del ciclo de vida de la app.
 * Retorna una función cleanup para remover las suscripciones al desmontar.
 */
export function setupNotificationListeners(): () => void {
  const subscriptions: { remove?: () => void }[] = [];

  try {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const receivedSub = addNotificationReceivedListener((notification) => {
      console.log(
        "Notificación recibida:",
        notification.request.content.title,
      );
    });
    if (receivedSub) subscriptions.push(receivedSub);

    const responseSub = addNotificationResponseReceivedListener((response) => {
      void handleNotificationResponse(response);
    });
    if (responseSub) subscriptions.push(responseSub);

    void registrarCategoriaNotificaciones();
  } catch {
    // Ignorar en entornos sin soporte nativo de notificaciones
  }

  return () => {
    subscriptions.forEach((sub) => sub.remove?.());
  };
}

type LocalPermissionStatus = "idle" | "granted" | "denied" | "loading";

export function useLocalNotifications() {
  const [permissionStatus, setPermissionStatus] =
    useState<LocalPermissionStatus>("idle");
  const isRequestingRef = useRef(false);

  const requestPermission = useCallback(
    async (showAlertOnDenied = false): Promise<boolean> => {
      if (isRequestingRef.current) return false;
      isRequestingRef.current = true;
      setPermissionStatus("loading");

      if (Platform.OS === "android") {
        try {
          await setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
            name: "Recordatorios",
            importance: AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#2563EB",
          });
        } catch {
          // Canal Android no disponible en entorno web/emulador sin soporte
        }
      }

      await registrarCategoriaNotificaciones();

      try {
        const existingPermission = await getPermissionsAsync();
        let finalStatus = existingPermission.status;
        let canAskAgain = existingPermission.canAskAgain;

        if (existingPermission.status !== "granted") {
          const requested = await requestPermissionSafely(
            () =>
              requestPermissionsAsync({
                android: {},
                ios: { allowAlert: true, allowBadge: true, allowSound: true },
              }),
            () => getPermissionsAsync(),
          );
          finalStatus = requested.status;
          canAskAgain = requested.canAskAgain;
        }

        const granted = finalStatus === "granted";
        setPermissionStatus(granted ? "granted" : "denied");

        if (!granted && showAlertOnDenied) {
          showPermissionAlert(canAskAgain, {
            blockedTitle: "Permisos de notificación desactivados",
            blockedMessage:
              "Debes habilitar las notificaciones desde los Ajustes del dispositivo para recibir recordatorios.",
          });
        }

        return granted;
      } catch (error) {
        console.warn("[LocalNotif] Error verificando permisos:", error);
        setPermissionStatus("denied");
        return false;
      } finally {
        isRequestingRef.current = false;
      }
    },
    [],
  );

  const programarNotificacion = useCallback(
    async (
      titulo: string,
      descripcion: string,
      segundos: number = 5,
      options?: ScheduleNotificationOptions,
    ): Promise<string | null> => {
      const hasPermission = await requestPermission(true);
      if (!hasPermission) return null;

      try {
        const formattedTitle = formatearTituloNotificacion(
          titulo,
          options?.category,
        );
        const formattedBody =
          options?.targetDate || options?.targetTime
            ? formatearCuerpoNotificacion(
                descripcion,
                options?.targetDate,
                options?.targetTime,
              )
            : descripcion || "Tienes una tarea programada.";

        const id = await scheduleNotificationAsync({
          content: {
            title: formattedTitle,
            body: formattedBody,
            sound: "default",
            categoryIdentifier: REMINDER_CATEGORY_ID,
            data: {
              reminderId: options?.reminderId,
              category: options?.category,
              username: options?.username,
            },
          },
          trigger: {
            type: SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(segundos, 1),
            repeats: false,
            channelId: ANDROID_CHANNEL_ID,
          },
        });
        return id;
      } catch (error) {
        console.error(
          "[LocalNotif] Error al programar la notificación:",
          error,
        );
        return null;
      }
    },
    [requestPermission],
  );

  const cancelarNotificacion = useCallback(
    async (notificationId?: string | null) => {
      if (!notificationId) return;
      try {
        await cancelScheduledNotificationAsync(notificationId);
      } catch (err) {
        console.warn("[LocalNotif] Error al cancelar:", err);
      }
    },
    [],
  );

  const cancelarMultiplesNotificaciones = useCallback(
    async (notificationIds: (string | null | undefined)[]) => {
      const validIds = notificationIds.filter((id): id is string =>
        Boolean(id),
      );
      await Promise.all(
        validIds.map((id) =>
          Promise.resolve(cancelScheduledNotificationAsync(id)).catch(
            () => undefined,
          ),
        ),
      );
    },
    [],
  );

  return {
    permissionStatus,
    programarNotificacion,
    cancelarNotificacion,
    cancelarMultiplesNotificaciones,
    actualizarBadgeCount,
    sincronizarBadgePendientes,
  };
}
