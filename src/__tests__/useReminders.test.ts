import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useReminders } from "../hooks/useReminders";
import { useReminderStore } from "../store/useReminderStore";
import { Reminder } from "../types";

jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void) => callback(),
}));

const mockProgramar = jest.fn();
const mockCancelar = jest.fn();
const mockCancelarMultiples = jest.fn();

jest.mock("../hooks/useLocalNotifications", () => ({
  useLocalNotifications: () => ({
    programarNotificacion: mockProgramar,
    cancelarNotificacion: mockCancelar,
    cancelarMultiplesNotificaciones: mockCancelarMultiples,
  }),
}));

const sampleReminder: Reminder = {
  id: "test-1",
  username: "user_test",
  title: "Test title",
  description: "Test description",
  date: "2026-11-06",
  time: "10:00",
  category: "trabajo",
  completed: false,
  notificationId: "notif-1",
};

describe("useReminders Hook Refactored", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useReminderStore.setState({
      reminders: [sampleReminder],
      loading: false,
    });
  });

  it("devuelve los recordatorios del store y llama a loadReminders con useFocusEffect", () => {
    const loadSpy = jest.fn();
    useReminderStore.setState({ loadReminders: loadSpy });

    const { result } = renderHook(() => useReminders("user_test"));

    expect(result.current.reminders).toHaveLength(1);
    expect(result.current.reminders[0].id).toBe("test-1");
    expect(loadSpy).toHaveBeenCalledWith("user_test");
  });

  it("toggleComplete actualiza el estado de completado e invoca updateReminder en el store", async () => {
    const updateSpy = jest.fn().mockResolvedValue(true);
    useReminderStore.setState({ updateReminder: updateSpy });

    const { result } = renderHook(() => useReminders("user_test"));

    await act(async () => {
      await result.current.toggleComplete("test-1");
    });

    expect(mockCancelar).toHaveBeenCalledWith("notif-1");
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "test-1",
        completed: true,
        notificationId: null,
      }),
      "user_test"
    );
  });

  it("confirmAndDelete muestra alerta y llama a deleteReminder del store al confirmar", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const deleteSpy = jest.fn().mockResolvedValue(true);
    useReminderStore.setState({ deleteReminder: deleteSpy });

    const { result } = renderHook(() => useReminders("user_test"));

    act(() => {
      result.current.confirmAndDelete("test-1");
    });

    expect(alertSpy).toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0][2];
    const deleteBtn = buttons?.find((b) => b.text === "Eliminar");

    await act(async () => {
      await deleteBtn?.onPress?.();
    });

    expect(mockCancelar).toHaveBeenCalledWith("notif-1");
    expect(deleteSpy).toHaveBeenCalledWith("test-1", "user_test");
  });

  it("cancelUserNotifications cancela las notificaciones de los recordatorios pendientes", async () => {
    const { result } = renderHook(() => useReminders("user_test"));

    await act(async () => {
      await result.current.cancelUserNotifications();
    });

    expect(mockCancelarMultiples).toHaveBeenCalledWith(["notif-1"]);
  });
});

