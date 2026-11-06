import { act } from "@testing-library/react-native";
import { useReminderStore } from "../store/useReminderStore";
import * as reminderStorage from "../services/reminderStorage";
import { Reminder } from "../types";

jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("../services/reminderStorage");

const mockRemindersUser1: Reminder[] = [
  {
    id: "1",
    title: "Reunión",
    description: "Reunión de equipo",
    date: "2026-11-06",
    time: "10:00",
    category: "trabajo",
    completed: false,
    username: "user1",
  },
];

const mockRemindersUser2: Reminder[] = [
  {
    id: "2",
    title: "Gimnasio",
    description: "Rutina pierna",
    date: "2026-11-06",
    time: "18:00",
    category: "salud",
    completed: false,
    username: "user2",
  },
];

describe("useReminderStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useReminderStore.setState({ reminders: [], loading: false });
  });

  it("loadReminders carga los recordatorios del usuario y actualiza loading", async () => {
    (reminderStorage.getStoredReminders as jest.Mock).mockResolvedValueOnce(
      mockRemindersUser1,
    );

    expect(useReminderStore.getState().reminders).toEqual([]);
    expect(useReminderStore.getState().loading).toBe(false);

    let loadPromise: Promise<void>;
    act(() => {
      loadPromise = useReminderStore.getState().loadReminders("user1");
    });

    await act(async () => {
      await loadPromise;
    });

    expect(reminderStorage.getStoredReminders).toHaveBeenCalledWith("user1");
    expect(useReminderStore.getState().reminders).toEqual(mockRemindersUser1);
    expect(useReminderStore.getState().loading).toBe(false);
  });

  it("addReminder guarda y refresca los recordatorios del usuario", async () => {
    const newReminder: Reminder = {
      id: "3",
      title: "Comprar insumos",
      description: "Supermercado",
      date: "2026-11-07",
      time: "09:00",
      category: "personal",
      completed: false,
      username: "user1",
    };

    (reminderStorage.saveReminder as jest.Mock).mockResolvedValueOnce(true);
    (reminderStorage.getStoredReminders as jest.Mock).mockResolvedValueOnce([
      newReminder,
      ...mockRemindersUser1,
    ]);

    let result: boolean = false;
    await act(async () => {
      result = await useReminderStore.getState().addReminder(newReminder);
    });

    expect(result).toBe(true);
    expect(reminderStorage.saveReminder).toHaveBeenCalledWith(
      newReminder,
      "user1",
    );
    expect(reminderStorage.getStoredReminders).toHaveBeenCalledWith("user1");
    expect(useReminderStore.getState().reminders).toHaveLength(2);
    expect(useReminderStore.getState().loading).toBe(false);
  });

  it("updateReminder actualiza el recordatorio y refresca el store", async () => {
    const updatedReminder: Reminder = {
      ...mockRemindersUser1[0],
      title: "Reunión cambiada",
    };

    (reminderStorage.updateReminder as jest.Mock).mockResolvedValueOnce(true);
    (reminderStorage.getStoredReminders as jest.Mock).mockResolvedValueOnce([
      updatedReminder,
    ]);

    let result: boolean = false;
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
    expect(useReminderStore.getState().reminders[0].title).toBe(
      "Reunión cambiada",
    );
    expect(useReminderStore.getState().loading).toBe(false);
  });

  it("deleteReminder elimina el recordatorio aislado por usuario", async () => {
    (reminderStorage.removeReminder as jest.Mock).mockResolvedValueOnce([]);

    let result: boolean = false;
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
});
