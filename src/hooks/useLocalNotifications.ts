import { useCallback, useRef, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

// Nota de Arquitectura: Se importan submódulos específicos de expo-notifications/build/
// para evitar que Expo Go (SDK 53+) cargue el módulo de Remote Push Notifications
// que emite advertencias al no usarse en notificaciones locales.
import { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
import { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
import { addNotificationReceivedListener } from "expo-notifications/build/NotificationsEmitter";
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications/build/NotificationPermissions";
import { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
import { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";
import { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
import { SchedulableTriggerInputTypes } from "expo-notifications/build/Notifications.types";

import { requestPermissionSafely } from "../utils/permissionHelpers";

const ANDROID_CHANNEL_ID = "recordatorios";

// Inicializador único a nivel de módulo del handler y listener en primer plano
try {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  addNotificationReceivedListener((notification) => {
    console.log(
      "Notificación recibida:",
      notification.request.content.title,
    );
  });
} catch (e) {
  console.warn("[LocalNotif] Handler/Listener no soportado en este entorno:", e);
}

type PermissionStatus = "idle" | "granted" | "denied" | "loading";

export function useLocalNotifications() {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("idle");
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
            sound: "default",
          });
        } catch (err) {
          // Canal Android no disponible en entorno web/emulador sin soporte
        }
      }

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

        if (!granted && showAlertOnDenied && !canAskAgain) {
          Alert.alert(
            "Permisos de notificación desactivados",
            "Debes habilitar las notificaciones desde los Ajustes del dispositivo para recibir recordatorios.",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
            ],
          );
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
    ): Promise<string | null> => {
      const hasPermission = await requestPermission(true);
      if (!hasPermission) return null;

      try {
        const id = await scheduleNotificationAsync({
          content: {
            title: `⏰ ${titulo}`,
            body: descripcion || "Tienes una tarea programada.",
            sound: "default",
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
          cancelScheduledNotificationAsync(id).catch(() => undefined),
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
  };
}
