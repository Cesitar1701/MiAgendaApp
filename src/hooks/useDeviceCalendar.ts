import { useState, useCallback } from "react";
import { Alert, Linking, Platform, PermissionsAndroid } from "react-native";
import { PermissionStatus } from "expo";
import * as Calendar from "expo-calendar/legacy";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Reminder, ReminderLocation } from "../types";
import { requestPermissionSafely } from "../utils/permissionHelpers";
import { reconstructReminderDate } from "../utils/dateHelpers";

export interface CalendarPermissionOptions {
  silent?: boolean;
}

export interface CalendarActionOptions {
  silent?: boolean;
}

export type CalendarEventInput = Omit<Partial<Reminder>, "location"> & {
  title: string;
  notes?: string;
  startDate?: Date | string | number;
  endDate?: Date | string | number;
  location?: string | ReminderLocation;
  timeZone?: string;
};

const PERMISSION_GRANTED = PermissionStatus.GRANTED;

/**
 * Detecta si la aplicación se está ejecutando dentro de la app cliente Expo Go.
 */
export const isRunningInExpoGoEnvironment = (): boolean => {
  try {
    return (
      Constants.appOwnership === "expo" ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    );
  } catch {
    return false;
  }
};

/**
 * Verifica directamente a nivel nativo de Android los permisos de lectura y escritura del calendario.
 */
export const checkAndroidCalendarPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return false;
  try {
    if (
      PermissionsAndroid &&
      typeof PermissionsAndroid.check === "function" &&
      PermissionsAndroid.PERMISSIONS?.READ_CALENDAR &&
      PermissionsAndroid.PERMISSIONS?.WRITE_CALENDAR
    ) {
      const [readGranted, writeGranted] = await Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CALENDAR),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR),
      ]);
      return Boolean(readGranted && writeGranted);
    }
  } catch {
    // Fallback silencioso a la verificación estándar de Expo
  }
  return false;
};

/**
 * Obtiene de forma segura la zona horaria del dispositivo o recurre a UTC.
 */
export const getDeviceTimeZone = (): string => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && typeof tz === "string" && tz.trim().length > 0) {
      return tz;
    }
  } catch {
    // Fallback silencioso a UTC en caso de entornos sin Intl completo
  }
  return "UTC";
};

/**
 * Resuelve la fecha de inicio a partir de múltiples formatos posibles.
 */
export const resolveStartDate = (input: CalendarEventInput): Date => {
  if (input.startDate instanceof Date) return input.startDate;
  if (typeof input.startDate === "number" || typeof input.startDate === "string") {
    return new Date(input.startDate);
  }
  if (typeof input.targetTimestamp === "number" && !isNaN(input.targetTimestamp)) {
    return new Date(input.targetTimestamp);
  }
  if (input.date && input.time) {
    return reconstructReminderDate({
      date: input.date,
      time: input.time,
      isoDate: input.isoDate,
      targetTimestamp: input.targetTimestamp,
    });
  }
  const fallback = new Date();
  fallback.setSeconds(0, 0);
  return fallback;
};

/**
 * Resuelve la fecha de finalización o asigna una hora de duración por defecto.
 */
export const resolveEndDate = (
  input: CalendarEventInput,
  startDate: Date,
): Date => {
  if (input.endDate instanceof Date) return input.endDate;
  if (typeof input.endDate === "number" || typeof input.endDate === "string") {
    return new Date(input.endDate);
  }
  return new Date(startDate.getTime() + 60 * 60 * 1000);
};

/**
 * Convierte una ubicación string o ReminderLocation a un string legible para el calendario.
 */
export const resolveLocationString = (
  location?:
    | string
    | ReminderLocation
    | { address?: string; latitude?: number; longitude?: number },
): string | undefined => {
  if (!location) return undefined;
  if (typeof location === "string") return location.trim() || undefined;
  if (location.address?.trim()) return location.address.trim();
  if (location.latitude != null && location.longitude != null) {
    return `${location.latitude}, ${location.longitude}`;
  }
  return undefined;
};

export function useDeviceCalendar() {
  const [loading, setLoading] = useState<boolean>(false);

  const solicitarPermisoCalendario = useCallback(
    async (options?: CalendarPermissionOptions): Promise<boolean> => {
      const silent = Boolean(options?.silent);
      try {
        if (isRunningInExpoGoEnvironment()) {
          if (!silent) {
            Alert.alert(
              "No compatible con Expo Go",
              "La sincronización con el calendario nativo no está soportada en la app Expo Go debido a restricciones nativas de Expo SDK 51+. Para sincronizar con el calendario del dispositivo se requiere ejecutar un Development Build nativo (npx expo run:android o npx expo run:ios).",
            );
          }
          return false;
        }

        if (Calendar.isAvailableAsync) {
          const available = await Calendar.isAvailableAsync();
          if (!available) {
            if (!silent) {
              Alert.alert(
                "Servicio no disponible",
                "El acceso al calendario no está disponible en este dispositivo o entorno.",
              );
            }
            return false;
          }
        }

        const getPermissionsFn =
          Calendar.getCalendarPermissionsAsync ??
          (Calendar as any).getPermissionsAsync;
        const requestPermissionsFn =
          Calendar.requestCalendarPermissionsAsync ??
          (Calendar as any).requestPermissionsAsync;

        const existing = await getPermissionsFn();
        let isGranted =
          existing.status === PERMISSION_GRANTED ||
          Boolean((existing as any).granted);
        let canAskAgain = existing.canAskAgain;

        if (!isGranted && Platform.OS === "android") {
          const nativeGranted = await checkAndroidCalendarPermissions();
          if (nativeGranted) {
            isGranted = true;
          }
        }

        if (!isGranted && canAskAgain !== false && !silent) {
          const requested = await requestPermissionSafely(
            () => requestPermissionsFn(),
            () => getPermissionsFn(),
          );
          isGranted =
            requested.status === PERMISSION_GRANTED ||
            Boolean((requested as any).granted);
          canAskAgain = requested.canAskAgain;

          if (!isGranted && Platform.OS === "android") {
            const nativeGranted = await checkAndroidCalendarPermissions();
            if (nativeGranted) {
              isGranted = true;
            }
          }
        }

        if (!isGranted) {
          if (!silent) {
            if (canAskAgain === false) {
              const iosHint =
                Platform.OS === "ios"
                  ? " En iOS, asegúrate de haber concedido 'Acceso completo' en los Ajustes."
                  : "";
              Alert.alert(
                "Permiso de calendario desactivado",
                `Debes habilitar el acceso al calendario desde los Ajustes del dispositivo para sincronizar tus recordatorios.${iosHint}`,
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
                ],
              );
            } else {
              Alert.alert(
                "Permiso denegado",
                "No se puede sincronizar con el calendario sin conceder el permiso correspondiente.",
              );
            }
          }
          return false;
        }

        return true;
      } catch (error) {
        console.warn("[useDeviceCalendar] Error al verificar permisos de calendario:", error);
        if (!silent) {
          Alert.alert("Error", "Ocurrió un error al verificar los permisos del calendario.");
        }
        return false;
      }
    },
    [],
  );

  const obtenerCalendarId = useCallback(async (): Promise<string | null> => {
    if (Platform.OS === "ios") {
      try {
        if (Calendar.getDefaultCalendarAsync) {
          const defaultCalendar = await Calendar.getDefaultCalendarAsync();
          if (defaultCalendar?.id) {
            return defaultCalendar.id;
          }
        }
      } catch (e) {
        console.warn("[useDeviceCalendar] Error al obtener calendario por defecto en iOS:", e);
      }
    }

    // Android o fallback en iOS si no hubo default
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes ? Calendar.EntityTypes.EVENT : undefined,
    );

    if (!calendars || calendars.length === 0) {
      return null;
    }

    const editableCalendar =
      calendars.find((c) => c.allowsModifications && c.isPrimary) ||
      calendars.find((c) => c.allowsModifications) ||
      calendars[0];

    return editableCalendar?.id ?? null;
  }, []);

  const crearEventoCalendario = useCallback(
    async (input: CalendarEventInput): Promise<string | null> => {
      setLoading(true);
      try {
        const hasPermission = await solicitarPermisoCalendario();
        if (!hasPermission) {
          return null;
        }

        const calendarId = await obtenerCalendarId();
        if (!calendarId) {
          Alert.alert(
            "Calendario no disponible",
            "No se encontró un calendario editable en el dispositivo para sincronizar el evento.",
          );
          return null;
        }

        const startDate = resolveStartDate(input);
        const endDate = resolveEndDate(input, startDate);
        const notes = input.description ?? input.notes ?? "";
        const locationStr = resolveLocationString(input.location);
        const timeZone = input.timeZone || getDeviceTimeZone();

        const eventData: Omit<Partial<Calendar.Event>, "id" | "organizer"> = {
          title: input.title,
          startDate,
          endDate,
          notes: notes || undefined,
          location: locationStr || undefined,
          timeZone,
        };

        if (input.leadTimeSeconds !== undefined && input.leadTimeSeconds !== null) {
          eventData.alarms = [
            {
              relativeOffset: -Math.round(input.leadTimeSeconds / 60),
            },
          ];
        }

        const eventId = await Calendar.createEventAsync(calendarId, eventData);
        return eventId;
      } catch (error) {
        console.warn("[useDeviceCalendar] Error al crear evento en calendario:", error);
        Alert.alert(
          "Error",
          "No se pudo sincronizar el evento en el calendario del dispositivo.",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [solicitarPermisoCalendario, obtenerCalendarId],
  );

  const actualizarEventoCalendario = useCallback(
    async (
      eventId: string,
      input: Partial<CalendarEventInput>,
    ): Promise<boolean> => {
      if (!eventId) return false;
      setLoading(true);
      try {
        const hasPermission = await solicitarPermisoCalendario();
        if (!hasPermission) {
          return false;
        }

        const updateData: Omit<Partial<Calendar.Event>, "id"> = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined || input.notes !== undefined) {
          updateData.notes = input.description ?? input.notes;
        }
        if (input.location !== undefined) {
          updateData.location = resolveLocationString(input.location);
        }
        if (input.timeZone !== undefined) {
          updateData.timeZone = input.timeZone;
        }

        if (
          input.startDate !== undefined ||
          input.targetTimestamp !== undefined ||
          (input.date !== undefined && input.time !== undefined)
        ) {
          const startDate = resolveStartDate(input as CalendarEventInput);
          updateData.startDate = startDate;
          updateData.endDate = resolveEndDate(input as CalendarEventInput, startDate);
        } else if (input.endDate !== undefined) {
          updateData.endDate = resolveEndDate(input as CalendarEventInput, new Date());
        }

        if (input.leadTimeSeconds !== undefined) {
          if (input.leadTimeSeconds !== null) {
            updateData.alarms = [
              {
                relativeOffset: -Math.round(input.leadTimeSeconds / 60),
              },
            ];
          } else {
            updateData.alarms = [];
          }
        }

        await Calendar.updateEventAsync(eventId, updateData);
        return true;
      } catch (error) {
        console.warn("[useDeviceCalendar] Error al actualizar evento en calendario:", error);
        Alert.alert(
          "Error",
          "No se pudo actualizar el evento en el calendario del dispositivo.",
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [solicitarPermisoCalendario],
  );

  const eliminarEventoCalendario = useCallback(
    async (
      eventId: string,
      options?: CalendarActionOptions,
    ): Promise<boolean> => {
      if (!eventId) return false;
      setLoading(true);
      try {
        const isSilent = options?.silent !== undefined ? options.silent : true;
        const hasPermission = await solicitarPermisoCalendario({ silent: isSilent });
        if (!hasPermission) {
          return false;
        }

        await Calendar.deleteEventAsync(eventId);
        return true;
      } catch (error) {
        console.warn("[useDeviceCalendar] Error al eliminar evento de calendario:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [solicitarPermisoCalendario],
  );

  return {
    loading,
    solicitarPermisoCalendario,
    obtenerCalendarId,
    crearEventoCalendario,
    actualizarEventoCalendario,
    eliminarEventoCalendario,
  };
}
