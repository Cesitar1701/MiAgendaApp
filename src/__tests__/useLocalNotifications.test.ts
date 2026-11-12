import { renderHook, act } from "@testing-library/react-native";
import { Alert, Linking, Platform } from "react-native";
import {
  useLocalNotifications,
  REMINDER_CATEGORY_ID,
  ACTION_COMPLETE_REMINDER,
  CATEGORY_EMOJIS,
  formatearTituloNotificacion,
  formatearCuerpoNotificacion,
  registrarCategoriaNotificaciones,
  actualizarBadgeCount,
  sincronizarBadgePendientes,
  marcarRecordatorioCompletadoPorNotificacion,
  handleNotificationResponse,
} from "../hooks/useLocalNotifications";
import { useReminderStore } from "../store/useReminderStore";
import * as reminderStorage from "../services/reminderStorage";
import { Reminder } from "../types";

// Mocks de Expo Notifications
const mockSetNotificationChannelAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();
const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSetNotificationCategoryAsync = jest.fn();
const mockSetBadgeCountAsync = jest.fn();
const mockDismissNotificationAsync = jest.fn();
const mockAddNotificationReceivedListener = jest.fn();
const mockAddNotificationResponseReceivedListener = jest.fn();
const mockSetNotificationHandler = jest.fn();

jest.mock("expo-notifications/build/setNotificationChannelAsync", () => ({
  setNotificationChannelAsync: (...args: any[]) =>
    mockSetNotificationChannelAsync(...args),
}));

jest.mock("expo-notifications/build/scheduleNotificationAsync", () => ({
  scheduleNotificationAsync: (...args: any[]) =>
    mockScheduleNotificationAsync(...args),
}));

jest.mock("expo-notifications/build/cancelScheduledNotificationAsync", () => ({
  cancelScheduledNotificationAsync: (...args: any[]) =>
    mockCancelScheduledNotificationAsync(...args),
}));

jest.mock("expo-notifications/build/NotificationPermissions", () => ({
  getPermissionsAsync: (...args: any[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: any[]) =>
    mockRequestPermissionsAsync(...args),
}));

jest.mock("expo-notifications/build/setNotificationCategoryAsync", () => ({
  setNotificationCategoryAsync: (...args: any[]) =>
    mockSetNotificationCategoryAsync(...args),
}));

jest.mock("expo-notifications/build/setBadgeCountAsync", () => ({
  setBadgeCountAsync: (...args: any[]) => mockSetBadgeCountAsync(...args),
}));

jest.mock("expo-notifications/build/dismissNotificationAsync", () => ({
  dismissNotificationAsync: (...args: any[]) =>
    mockDismissNotificationAsync(...args),
}));

jest.mock("expo-notifications/build/NotificationsEmitter", () => ({
  addNotificationReceivedListener: (...args: any[]) =>
    mockAddNotificationReceivedListener(...args),
  addNotificationResponseReceivedListener: (...args: any[]) =>
    mockAddNotificationResponseReceivedListener(...args),
}));

jest.mock("expo-notifications/build/NotificationsHandler", () => ({
  setNotificationHandler: (...args: any[]) =>
    mockSetNotificationHandler(...args),
}));

jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("../services/reminderStorage");

describe("useLocalNotifications & Notification UI/UX", () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = "android";
    mockGetPermissionsAsync.mockResolvedValue({
      status: "granted",
      canAskAgain: true,
    });
    mockRequestPermissionsAsync.mockResolvedValue({
      status: "granted",
      canAskAgain: true,
    });
    mockSetBadgeCountAsync.mockResolvedValue(true);
    mockSetNotificationCategoryAsync.mockResolvedValue({});
    mockDismissNotificationAsync.mockResolvedValue(undefined);
    mockCancelScheduledNotificationAsync.mockResolvedValue(undefined);
    useReminderStore.setState({ reminders: [], loading: false });
  });

  afterEach(() => {
    (Platform as any).OS = originalPlatform;
    jest.restoreAllMocks();
  });

  describe("Formateo enriquecido de Notificaciones (UI/UX)", () => {
    it("formatea el título con el emoji correspondiente a cada categoría", () => {
      expect(formatearTituloNotificacion("Revisar reporte", "urgente")).toBe(
        "🚨 Revisar reporte",
      );
      expect(formatearTituloNotificacion("Junta directiva", "trabajo")).toBe(
        "💼 Junta directiva",
      );
      expect(formatearTituloNotificacion("Tomar pastilla", "salud")).toBe(
        "💊 Tomar pastilla",
      );
      expect(formatearTituloNotificacion("Comprar flores", "personal")).toBe(
        "👤 Comprar flores",
      );
    });

    it("usa el emoji por defecto cuando no se indica categoría", () => {
      expect(formatearTituloNotificacion("Alarma")).toBe("⏰ Alarma");
    });

    it("formatea el cuerpo con fecha, hora y descripción", () => {
      const cuerpo = formatearCuerpoNotificacion(
        "Entregar informe anual",
        "12/11/2026",
        "18:00",
      );
      expect(cuerpo).toBe("📅 12/11/2026, 18:00 • Entregar informe anual");
    });

    it("muestra texto por defecto si la descripción y fecha están vacías", () => {
      expect(formatearCuerpoNotificacion()).toBe(
        "Tienes una tarea programada.",
      );
    });
  });

  describe("Acciones Rápidas y Categorías de Notificación", () => {
    it("registra la categoría con botón de completar tarea sin traer la app al frente forzosamente", async () => {
      await registrarCategoriaNotificaciones();

      expect(mockSetNotificationCategoryAsync).toHaveBeenCalledWith(
        REMINDER_CATEGORY_ID,
        [
          expect.objectContaining({
            identifier: ACTION_COMPLETE_REMINDER,
            buttonTitle: "✔ Completar tarea",
            options: { opensAppToForeground: false },
          }),
        ],
      );
    });

    it("marcarRecordatorioCompletadoPorNotificacion actualiza el recordatorio en el store y sincroniza badge", async () => {
      const sampleReminder: Reminder = {
        id: "rem-100",
        username: "testuser",
        title: "Pagar recibo",
        description: "Luz y agua",
        date: "2026-11-12",
        time: "15:00",
        category: "urgente",
        completed: false,
        notificationId: "notif-100",
      };

      (reminderStorage.getStoredReminders as jest.Mock).mockResolvedValue([
        { ...sampleReminder, completed: true, notificationId: null },
      ]);
      (reminderStorage.updateReminder as jest.Mock).mockResolvedValue(true);

      useReminderStore.setState({ reminders: [sampleReminder] });

      const success = await marcarRecordatorioCompletadoPorNotificacion(
        "rem-100",
        "testuser",
      );

      expect(success).toBe(true);
      expect(reminderStorage.updateReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "rem-100",
          completed: true,
          notificationId: null,
        }),
        "testuser",
      );
      expect(mockSetBadgeCountAsync).toHaveBeenCalledWith(0);
    });

    it("handleNotificationResponse procesa la acción ✔ Completar tarea y descarta la notificación", async () => {
      const sampleReminder: Reminder = {
        id: "rem-200",
        username: "testuser",
        title: "Pasear al perro",
        description: "Parque",
        date: "2026-11-12",
        time: "19:00",
        category: "personal",
        completed: false,
        notificationId: "notif-200",
      };

      useReminderStore.setState({ reminders: [sampleReminder] });
      (reminderStorage.updateReminder as jest.Mock).mockResolvedValue(true);

      const fakeResponse = {
        actionIdentifier: ACTION_COMPLETE_REMINDER,
        notification: {
          request: {
            identifier: "native-notif-id-999",
            content: {
              data: {
                reminderId: "rem-200",
                username: "testuser",
              },
            },
          },
        },
      };

      await handleNotificationResponse(fakeResponse as any);

      expect(reminderStorage.updateReminder).toHaveBeenCalledWith(
        expect.objectContaining({ id: "rem-200", completed: true }),
        "testuser",
      );
      expect(mockDismissNotificationAsync).toHaveBeenCalledWith(
        "native-notif-id-999",
      );
    });
  });

  describe("Sincronización de Badges", () => {
    it("actualizarBadgeCount envía el número al módulo nativo", async () => {
      await actualizarBadgeCount(3);
      expect(mockSetBadgeCountAsync).toHaveBeenCalledWith(3);
    });

    it("sincronizarBadgePendientes calcula las tareas no completadas y actualiza el contador", async () => {
      const reminders: Reminder[] = [
        {
          id: "1",
          title: "T1",
          description: "",
          date: "",
          time: "",
          category: "trabajo",
          completed: false,
        },
        {
          id: "2",
          title: "T2",
          description: "",
          date: "",
          time: "",
          category: "salud",
          completed: true,
        },
        {
          id: "3",
          title: "T3",
          description: "",
          date: "",
          time: "",
          category: "urgente",
          completed: false,
        },
      ];

      useReminderStore.setState({ reminders });

      const pendingCount = await sincronizarBadgePendientes("user1");

      expect(pendingCount).toBe(2);
      expect(mockSetBadgeCountAsync).toHaveBeenCalledWith(2);
    });
  });

  describe("Hook useLocalNotifications", () => {
    it("crea el canal de Android sin parámetro de sonido custom para evitar warnings", async () => {
      const { result } = renderHook(() => useLocalNotifications());

      await act(async () => {
        await result.current.programarNotificacion("Tarea", "Desc", 10);
      });

      expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith(
        "recordatorios",
        expect.objectContaining({
          name: "Recordatorios",
          lightColor: "#2563EB",
        }),
      );
      const channelArgs = mockSetNotificationChannelAsync.mock.calls[0][1];
      expect(channelArgs.sound).toBeUndefined();
      expect(mockSetNotificationChannelAsync).not.toHaveBeenCalledWith(
        "recordatorios",
        expect.objectContaining({
          sound: "default",
        }),
      );
    });

    it("programa notificación con categoría rica y botón de acción interactivo", async () => {
      mockScheduleNotificationAsync.mockResolvedValue("scheduled-notif-123");
      const { result } = renderHook(() => useLocalNotifications());

      let notifId: string | null = null;
      await act(async () => {
        notifId = await result.current.programarNotificacion(
          "Entrega de Proyecto",
          "Subir a producción",
          60,
          {
            category: "trabajo",
            reminderId: "rem-999",
            username: "bart",
            targetDate: "12/11/2026",
            targetTime: "20:00",
          },
        );
      });

      expect(notifId).toBe("scheduled-notif-123");
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "💼 Entrega de Proyecto",
            body: "📅 12/11/2026, 20:00 • Subir a producción",
            categoryIdentifier: REMINDER_CATEGORY_ID,
            data: {
              reminderId: "rem-999",
              category: "trabajo",
              username: "bart",
            },
          }),
        }),
      );
    });

    it("cancela notificaciones individuales y múltiples correctamente", async () => {
      const { result } = renderHook(() => useLocalNotifications());

      await act(async () => {
        await result.current.cancelarNotificacion("id-1");
      });
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith("id-1");

      await act(async () => {
        await result.current.cancelarMultiplesNotificaciones([
          "id-2",
          null,
          "id-3",
        ]);
      });
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith("id-2");
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith("id-3");
    });
  });
});
