import { renderHook, act } from "@testing-library/react-native";
import { Alert, Linking, Platform, PermissionsAndroid } from "react-native";
import Constants from "expo-constants";
import * as Calendar from "expo-calendar/legacy";
import {
  useDeviceCalendar,
  getDeviceTimeZone,
  resolveLocationString,
  resolveStartDate,
  resolveEndDate,
} from "../hooks/useDeviceCalendar";

jest.mock("expo-calendar/legacy", () => ({
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  EntityTypes: {
    EVENT: "event",
    REMINDER: "reminder",
  },
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getCalendarPermissionsAsync: jest.fn(),
  requestCalendarPermissionsAsync: jest.fn(),
  getDefaultCalendarAsync: jest.fn(),
  getCalendarsAsync: jest.fn(),
  createEventAsync: jest.fn(),
  updateEventAsync: jest.fn(),
  deleteEventAsync: jest.fn(),
}));

describe("useDeviceCalendar Hook", () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = "android";
    (Calendar.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(Linking, "openSettings").mockResolvedValue();
  });

  afterEach(() => {
    (Platform as any).OS = originalPlatform;
    jest.restoreAllMocks();
  });

  describe("solicitarPermisoCalendario", () => {
    it("muestra alerta y retorna false si la aplicación corre en Expo Go", async () => {
      (Constants as any).appOwnership = "expo";
      const { result } = renderHook(() => useDeviceCalendar());

      let granted: boolean = true;
      await act(async () => {
        granted = await result.current.solicitarPermisoCalendario();
      });

      expect(granted).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "No compatible con Expo Go",
        expect.stringContaining("Development Build"),
      );
      (Constants as any).appOwnership = null;
    });

    it("concede el permiso si PermissionsAndroid.check retorna true en Android", async () => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "denied",
        canAskAgain: true,
      });
      jest.spyOn(PermissionsAndroid, "check").mockResolvedValue(true);

      const { result } = renderHook(() => useDeviceCalendar());

      let granted: boolean = false;
      await act(async () => {
        granted = await result.current.solicitarPermisoCalendario();
      });

      expect(granted).toBe(true);
    });

    it("retorna false y muestra alerta si el servicio no está disponible", async () => {
      (Calendar.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
      const { result } = renderHook(() => useDeviceCalendar());

      let granted: boolean = false;
      await act(async () => {
        granted = await result.current.solicitarPermisoCalendario();
      });

      expect(granted).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Servicio no disponible",
        expect.stringContaining("no está disponible"),
      );
    });

    it("retorna true directamente cuando el permiso ya está concedido", async () => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "granted",
        canAskAgain: true,
      });

      const { result } = renderHook(() => useDeviceCalendar());

      let granted: boolean = false;
      await act(async () => {
        granted = await result.current.solicitarPermisoCalendario();
      });

      expect(granted).toBe(true);
      expect(Calendar.requestCalendarPermissionsAsync).not.toHaveBeenCalled();
    });

    it("solicita el permiso si no está concedido y retorna true si el usuario lo acepta", async () => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "undetermined",
        canAskAgain: true,
      });
      (Calendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "granted",
        canAskAgain: true,
      });

      const { result } = renderHook(() => useDeviceCalendar());

      let granted: boolean = false;
      await act(async () => {
        granted = await result.current.solicitarPermisoCalendario();
      });

      expect(granted).toBe(true);
      expect(Calendar.requestCalendarPermissionsAsync).toHaveBeenCalled();
    });

    it("muestra alerta de permiso denegado cuando el usuario rechaza y canAskAgain es true", async () => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "undetermined",
        canAskAgain: true,
      });
      (Calendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "denied",
        canAskAgain: true,
      });

      const { result } = renderHook(() => useDeviceCalendar());

      let granted: boolean = true;
      await act(async () => {
        granted = await result.current.solicitarPermisoCalendario();
      });

      expect(granted).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Permiso denegado",
        expect.stringContaining("No se puede sincronizar"),
      );
    });

    it("ofrece abrir los ajustes del dispositivo cuando canAskAgain es false", async () => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "denied",
        canAskAgain: false,
      });

      const { result } = renderHook(() => useDeviceCalendar());

      let granted: boolean = true;
      await act(async () => {
        granted = await result.current.solicitarPermisoCalendario();
      });

      expect(granted).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Permiso de calendario desactivado",
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancelar" }),
          expect.objectContaining({ text: "Abrir ajustes" }),
        ]),
      );

      // Simular presionar Abrir ajustes
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const openSettingsButton = alertCall[2].find(
        (b: any) => b.text === "Abrir ajustes",
      );
      openSettingsButton.onPress();
      expect(Linking.openSettings).toHaveBeenCalled();
    });

    it("no muestra alerta ni solicita permisos si se utiliza la opción silent: true y el servicio no está disponible", async () => {
      (Calendar.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
      const { result } = renderHook(() => useDeviceCalendar());

      let granted: boolean = true;
      await act(async () => {
        granted = await result.current.solicitarPermisoCalendario({ silent: true });
      });

      expect(granted).toBe(false);
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("no muestra alerta de permisos si se utiliza la opción silent: true y el permiso está denegado", async () => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "denied",
        canAskAgain: false,
      });

      const { result } = renderHook(() => useDeviceCalendar());

      let granted: boolean = true;
      await act(async () => {
        granted = await result.current.solicitarPermisoCalendario({ silent: true });
      });

      expect(granted).toBe(false);
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("maneja errores de permisos capturando la excepción y retornando false", async () => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Fallo en módulo de calendario"),
      );

      const { result } = renderHook(() => useDeviceCalendar());

      let granted: boolean = true;
      await act(async () => {
        granted = await result.current.solicitarPermisoCalendario();
      });

      expect(granted).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        expect.stringContaining("error al verificar los permisos"),
      );
    });
  });

  describe("obtenerCalendarId", () => {
    it("en iOS usa getDefaultCalendarAsync para obtener el ID", async () => {
      (Platform as any).OS = "ios";
      (Calendar.getDefaultCalendarAsync as jest.Mock).mockResolvedValueOnce({
        id: "ios-default-cal-123",
        title: "Calendario iCloud",
      });

      const { result } = renderHook(() => useDeviceCalendar());

      let calId: string | null = null;
      await act(async () => {
        calId = await result.current.obtenerCalendarId();
      });

      expect(Calendar.getDefaultCalendarAsync).toHaveBeenCalled();
      expect(calId).toBe("ios-default-cal-123");
    });

    it("en Android selecciona un calendario con allowsModifications: true", async () => {
      (Platform as any).OS = "android";
      (Calendar.getCalendarsAsync as jest.Mock).mockResolvedValueOnce([
        {
          id: "holidays-cal",
          title: "Feriados (Solo lectura)",
          allowsModifications: false,
          isPrimary: false,
        },
        {
          id: "user-editable-cal",
          title: "Mi Calendario",
          allowsModifications: true,
          isPrimary: true,
        },
      ]);

      const { result } = renderHook(() => useDeviceCalendar());

      let calId: string | null = null;
      await act(async () => {
        calId = await result.current.obtenerCalendarId();
      });

      expect(Calendar.getCalendarsAsync).toHaveBeenCalledWith(Calendar.EntityTypes.EVENT);
      expect(calId).toBe("user-editable-cal");
    });

    it("retorna null si no se encuentran calendarios", async () => {
      (Platform as any).OS = "android";
      (Calendar.getCalendarsAsync as jest.Mock).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useDeviceCalendar());

      let calId: string | null = "dummy";
      await act(async () => {
        calId = await result.current.obtenerCalendarId();
      });

      expect(calId).toBeNull();
    });
  });

  describe("crearEventoCalendario", () => {
    beforeEach(() => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });
      (Calendar.getCalendarsAsync as jest.Mock).mockResolvedValue([
        {
          id: "primary-cal",
          allowsModifications: true,
          isPrimary: true,
        },
      ]);
    });

    it("crea un evento exitosamente y retorna el eventId", async () => {
      (Calendar.createEventAsync as jest.Mock).mockResolvedValueOnce("new-event-789");

      const { result } = renderHook(() => useDeviceCalendar());

      let eventId: string | null = null;
      await act(async () => {
        eventId = await result.current.crearEventoCalendario({
          title: "Reunión de planificación",
          description: "Definir metas del sprint",
          isoDate: "2026-11-15",
          time: "10:00",
          location: {
            latitude: -34.6037,
            longitude: -58.3816,
            address: "Oficinas Centrales",
          },
          leadTimeSeconds: 600,
        });
      });

      expect(eventId).toBe("new-event-789");
      expect(Calendar.createEventAsync).toHaveBeenCalledWith(
        "primary-cal",
        expect.objectContaining({
          title: "Reunión de planificación",
          notes: "Definir metas del sprint",
          location: "Oficinas Centrales",
          alarms: [{ relativeOffset: -10 }],
          timeZone: expect.any(String),
        }),
      );
    });

    it("respeta la zona horaria personalizada si se especifica", async () => {
      (Calendar.createEventAsync as jest.Mock).mockResolvedValueOnce("custom-tz-event");

      const { result } = renderHook(() => useDeviceCalendar());

      let eventId: string | null = null;
      await act(async () => {
        eventId = await result.current.crearEventoCalendario({
          title: "Evento con Zona Horaria",
          isoDate: "2026-11-15",
          time: "10:00",
          timeZone: "America/Argentina/Buenos_Aires",
        });
      });

      expect(eventId).toBe("custom-tz-event");
      expect(Calendar.createEventAsync).toHaveBeenCalledWith(
        "primary-cal",
        expect.objectContaining({
          timeZone: "America/Argentina/Buenos_Aires",
        }),
      );
    });

    it("retorna null si los permisos no son concedidos", async () => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "denied",
        canAskAgain: false,
      });

      const { result } = renderHook(() => useDeviceCalendar());

      let eventId: string | null = "dummy";
      await act(async () => {
        eventId = await result.current.crearEventoCalendario({
          title: "Reunión sin permisos",
          isoDate: "2026-11-15",
          time: "10:00",
        });
      });

      expect(eventId).toBeNull();
      expect(Calendar.createEventAsync).not.toHaveBeenCalled();
    });

    it("muestra alerta y retorna null si no hay un calendario disponible", async () => {
      (Calendar.getCalendarsAsync as jest.Mock).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useDeviceCalendar());

      let eventId: string | null = "dummy";
      await act(async () => {
        eventId = await result.current.crearEventoCalendario({
          title: "Reunión sin calendario",
          isoDate: "2026-11-15",
          time: "10:00",
        });
      });

      expect(eventId).toBeNull();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Calendario no disponible",
        expect.stringContaining("No se encontró un calendario editable"),
      );
    });

    it("maneja error en createEventAsync mostrando alerta y retornando null", async () => {
      (Calendar.createEventAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Fallo nativo de escritura en calendario"),
      );

      const { result } = renderHook(() => useDeviceCalendar());

      let eventId: string | null = "dummy";
      await act(async () => {
        eventId = await result.current.crearEventoCalendario({
          title: "Reunión fallida",
          isoDate: "2026-11-15",
          time: "10:00",
        });
      });

      expect(eventId).toBeNull();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        expect.stringContaining("No se pudo sincronizar el evento"),
      );
    });
  });

  describe("actualizarEventoCalendario", () => {
    beforeEach(() => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });
    });

    it("actualiza un evento existente y retorna true", async () => {
      (Calendar.updateEventAsync as jest.Mock).mockResolvedValueOnce("event-123");

      const { result } = renderHook(() => useDeviceCalendar());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.actualizarEventoCalendario("event-123", {
          title: "Reunión reprogramada",
          description: "Nueva agenda",
          location: "Sala B",
          leadTimeSeconds: 1200,
        });
      });

      expect(success).toBe(true);
      expect(Calendar.updateEventAsync).toHaveBeenCalledWith(
        "event-123",
        expect.objectContaining({
          title: "Reunión reprogramada",
          notes: "Nueva agenda",
          location: "Sala B",
          alarms: [{ relativeOffset: -20 }],
        }),
      );
    });

    it("retorna false si no se proporciona un eventId", async () => {
      const { result } = renderHook(() => useDeviceCalendar());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.actualizarEventoCalendario("", {
          title: "Sin id",
        });
      });

      expect(success).toBe(false);
      expect(Calendar.updateEventAsync).not.toHaveBeenCalled();
    });

    it("retorna false y muestra alerta si updateEventAsync lanza una excepción", async () => {
      (Calendar.updateEventAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Fallo de actualización nativa"),
      );

      const { result } = renderHook(() => useDeviceCalendar());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.actualizarEventoCalendario("event-123", {
          title: "Reunión con error",
        });
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        expect.stringContaining("No se pudo actualizar el evento"),
      );
    });
  });

  describe("eliminarEventoCalendario", () => {
    beforeEach(() => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });
    });

    it("elimina un evento existente e invoca deleteEventAsync retornando true", async () => {
      (Calendar.deleteEventAsync as jest.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeviceCalendar());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.eliminarEventoCalendario("event-to-delete");
      });

      expect(success).toBe(true);
      expect(Calendar.deleteEventAsync).toHaveBeenCalledWith("event-to-delete");
    });

    it("retorna false si no se proporciona un eventId", async () => {
      const { result } = renderHook(() => useDeviceCalendar());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.eliminarEventoCalendario("");
      });

      expect(success).toBe(false);
      expect(Calendar.deleteEventAsync).not.toHaveBeenCalled();
    });

    it("captura errores de deleteEventAsync y retorna false de forma segura", async () => {
      (Calendar.deleteEventAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Evento no encontrado en dispositivo"),
      );

      const { result } = renderHook(() => useDeviceCalendar());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.eliminarEventoCalendario("non-existing-event");
      });

      expect(success).toBe(false);
    });

    it("por defecto opera en modo silencioso y no muestra alertas si los permisos no fueron otorgados", async () => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "denied",
        canAskAgain: false,
      });

      const { result } = renderHook(() => useDeviceCalendar());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.eliminarEventoCalendario("event-123");
      });

      expect(success).toBe(false);
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(Calendar.deleteEventAsync).not.toHaveBeenCalled();
    });

    it("muestra alerta si se especifica silent: false y los permisos fueron denegados", async () => {
      (Calendar.getCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "denied",
        canAskAgain: false,
      });

      const { result } = renderHook(() => useDeviceCalendar());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.eliminarEventoCalendario("event-123", {
          silent: false,
        });
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Permiso de calendario desactivado",
        expect.any(String),
        expect.any(Array),
      );
      expect(Calendar.deleteEventAsync).not.toHaveBeenCalled();
    });
  });

  describe("Funciones auxiliares puras", () => {
    it("getDeviceTimeZone retorna una zona horaria válida o fallback", () => {
      const tz = getDeviceTimeZone();
      expect(typeof tz).toBe("string");
      expect(tz.length).toBeGreaterThan(0);
    });

    it("resolveLocationString formatea adecuadamente strings y objetos", () => {
      expect(resolveLocationString(undefined)).toBeUndefined();
      expect(resolveLocationString("")).toBeUndefined();
      expect(resolveLocationString("   ")).toBeUndefined();
      expect(resolveLocationString("Calle Falsa 123")).toBe("Calle Falsa 123");
      expect(
        resolveLocationString({
          address: "Av. Corrientes 1000",
        }),
      ).toBe("Av. Corrientes 1000");
      expect(
        resolveLocationString({
          latitude: -34.6037,
          longitude: -58.3816,
        }),
      ).toBe("-34.6037, -58.3816");
    });

    it("resolveStartDate y resolveEndDate calculan fechas correctamente", () => {
      const explicitDate = new Date("2026-12-01T15:00:00Z");
      const start = resolveStartDate({ title: "Test", startDate: explicitDate });
      expect(start).toEqual(explicitDate);

      const end = resolveEndDate({ title: "Test" }, start);
      expect(end.getTime()).toBe(start.getTime() + 60 * 60 * 1000);
    });
  });
});
