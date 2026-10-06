import { useEffect, useCallback, useRef, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as Device from "expo-device";
import type { EventSubscription } from "expo-modules-core";

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
/* import { SchedulableTriggerInputTypes } from "expo-notifications"; */
import { SchedulableTriggerInputTypes } from "expo-notifications/build/Notifications.types";

// Inicializador seguro del handler
try {
  setNotificationHandler({
    handleNotification: async () => ({
      /* shouldShowAlert: true, */
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.warn("[LocalNotif] Handler no soportado en este entorno:", e);
}

type PermissionStatus = "idle" | "granted" | "denied" | "loading";

export function useLocalNotifications() {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("idle");
  const notificationListener = useRef<EventSubscription | null>(null);

  const requestPermission = useCallback(
    async (showAlertOnDenied = false): Promise<boolean> => {
      setPermissionStatus("loading");

      if (Platform.OS === "android") {
        try {
          await setNotificationChannelAsync("recordatorios", {
            name: "Recordatorios",
            importance: AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#2563EB",
            sound: "default",
          });
        } catch (err) {
          /*    console.warn("[LocalNotif] Canal Android no disponible:", err); */
        }
      }

      try {
        const existingPermission = await getPermissionsAsync();
        let finalStatus = existingPermission.status;
        let canAskAgain = existingPermission.canAskAgain;

        if (existingPermission.status !== "granted") {
          const requested = await requestPermissionsAsync({
            android: {},
            ios: { allowAlert: true, allowBadge: true, allowSound: true },
          });
          finalStatus = requested.status;
          canAskAgain = requested.canAskAgain;
        }

        const granted = finalStatus === "granted";
        setPermissionStatus(granted ? "granted" : "denied");

        if (!granted && showAlertOnDenied) {
          Alert.alert(
            "Permisos desactivados",
            canAskAgain
              ? "Habilita los permisos para recibir recordatorios."
              : "Debes habilitar las notificaciones desde Ajustes.",
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
      }
    },
    [],
  );

  useEffect(() => {
    try {
      notificationListener.current = addNotificationReceivedListener(
        (notification) => {
          console.log(
            "Notificación recibida:",
            notification.request.content.title,
          );
        },
      );
    } catch (e) {
      console.warn("[LocalNotif] Listener no disponible en este entorno.");
    }

    return () => {
      notificationListener.current?.remove();
    };
  }, []);

  const programarNotificacion = async (
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
        },
      });
      return id;
    } catch (error) {
      console.error("[LocalNotif] Error al programar la notificacion:", error);
      return null;
    }
  };

  const cancelarNotificacion = async (notificationId?: string | null) => {
    if (!notificationId) return;
    try {
      await cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
      console.warn("[LocalNotif] Error al cancelar:", err);
    }
  };

  return {
    permissionStatus,
    programarNotificacion,
    cancelarNotificacion,
  };
}
