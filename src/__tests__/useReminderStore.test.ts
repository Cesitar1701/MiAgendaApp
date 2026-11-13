import { act } from "@testing-library/react-native";
import { useReminderStore } from "../store/useReminderStore";
import { useAuthStore } from "../store/useAuthStore";
import * as reminderStorage from "../services/reminderStorage";
import { Reminder } from "../types";

jest.mock(
  "@react-native-async-storage/async-storage",
  () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../services/reminderStorage");

const mockRemindersUser1: Reminder[] = [
  {
    id: "1",
    title: "Reunión",
    description: "Reunión de equipo",
    date: "06 nov 2026",
    isoDate: "2026-11-06",
    time: "10:00",
    targetTimestamp: new Date(2026, 10, 6, 10, 0).getTime(),
    category: "trabajo",
    completed: false,
    username: "user1",
  },
];

describe("useReminderStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, isHydrated: true, loading: false });
    useReminderStore.setState({
      reminders: [],
      loading: false,
      selectedDate: new Date(2026, 10, 6),
      isFilterActive: true,
    });
  });

  it("loadReminders carga los recordatorios del usuario activo desde useAuthStore si no se pasa parámetro", async () => {
    useAuthStore.setState({ user: "user1" });
    (reminderStorage.getStoredReminders as jest.Mock).mockResolvedValueOnce(
      mockRemindersUser1,
    );

    await act(async () => {
      await useReminderStore.getState().loadReminders();
    });

    expect(reminderStorage.getStoredReminders).toHaveBeenCalledWith("user1");
    expect(useReminderStore.getState().reminders).toEqual(mockRemindersUser1);
    expect(useReminderStore.getState().loading).toBe(false);
  });

  it("addReminder guarda y actualiza el store directamente sin doble lectura", async () => {
    const newReminder: Reminder = {
      id: "3",
      title: "Comprar insumos",
      description: "Supermercado",
      date: "07 nov 2026",
      isoDate: "2026-11-07",
      time: "09:00",
      targetTimestamp: new Date(2026, 10, 7, 9, 0).getTime(),
      category: "personal",
      completed: false,
      username: "user1",
    };

    (reminderStorage.saveReminder as jest.Mock).mockResolvedValueOnce([
      newReminder,
      ...mockRemindersUser1,
    ]);

    let result = false;
    await act(async () => {
      result = await useReminderStore.getState().addReminder(newReminder);
    });

    expect(result).toBe(true);
    expect(reminderStorage.saveReminder).toHaveBeenCalledWith(
      newReminder,
      "user1",
    );
    expect(reminderStorage.getStoredReminders).not.toHaveBeenCalled();
    expect(useReminderStore.getState().reminders).toHaveLength(2);
    expect(useReminderStore.getState().loading).toBe(false);
  });

  it("updateReminder actualiza el recordatorio y refresca el store en una sola operación", async () => {
    const updatedReminder: Reminder = {
      ...mockRemindersUser1[0],
      title: "Reunión cambiada",
    };

    (reminderStorage.updateReminder as jest.Mock).mockResolvedValueOnce([
      updatedReminder,
    ]);

    let result = false;
    await act(async () => {
      result = await useReminderStore
        .getState()
        .updateReminder(updatedReminder);
    });

    expect(result).toBe(true);
    expect(reminderStorage.updateReminder).toHaveBeenCalledWith(
      updatedReminder,
      "user1",
    );
    expect(reminderStorage.getStoredReminders).not.toHaveBeenCalled();
    expect(useReminderStore.getState().reminders[0].title).toBe(
      "Reunión cambiada",
    );
    expect(useReminderStore.getState().loading).toBe(false);
  });

  it("deleteReminder elimina el recordatorio aislado por usuario", async () => {
    (reminderStorage.removeReminder as jest.Mock).mockResolvedValueOnce([]);

    let result = false;
    await act(async () => {
      result = await useReminderStore
        .getState()
        .deleteReminder("1", "user1");
    });

    expect(result).toBe(true);
    expect(reminderStorage.removeReminder).toHaveBeenCalledWith("1", "user1");
    expect(useReminderStore.getState().reminders).toEqual([]);
    expect(useReminderStore.getState().loading).toBe(false);
  });

  it("permite actualizar selectedDate, isFilterActive y resetear el store", () => {
    const customDate = new Date(2026, 11, 24);

    act(() => {
      useReminderStore.getState().setSelectedDate(customDate);
      useReminderStore.getState().setIsFilterActive(false);
    });

    expect(useReminderStore.getState().selectedDate).toEqual(customDate);
    expect(useReminderStore.getState().isFilterActive).toBe(false);

    act(() => {
      useReminderStore.getState().resetStore();
    });

    expect(useReminderStore.getState().reminders).toEqual([]);
    expect(useReminderStore.getState().isFilterActive).toBe(true);
  });
});
