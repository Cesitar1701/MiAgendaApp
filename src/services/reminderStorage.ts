import AsyncStorage from "@react-native-async-storage/async-storage";
import { Reminder } from "../types";

const REMINDERS_KEY = "@reminders_list";

export const saveReminder = async (newReminder: Reminder): Promise<boolean> => {
  try {
    const current = await getStoredReminders();
    const updated = [newReminder, ...current];
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("Error al guardar recordatorio:", error);
    return false;
  }
};

export const getStoredReminders = async (): Promise<Reminder[]> => {
  try {
    const json = await AsyncStorage.getItem(REMINDERS_KEY);
    if (json) {
      return JSON.parse(json);
    }
    return [];
  } catch (error) {
    console.error("Error al obtener recordatorios:", error);
    return [];
  }
};

export const updateReminderStatus = async (id: string): Promise<Reminder[]> => {
  try {
    const current = await getStoredReminders();
    const updated = current.map((r) =>
      r.id === id ? { ...r, completed: !r.completed } : r,
    );
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error al actualizar el estado del recordatorio:", error);
    return await getStoredReminders();
  }
};

export const removeReminder = async (id: string): Promise<Reminder[]> => {
  try {
    const current = await getStoredReminders();
    const updated = current.filter((r) => r.id !== id);
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error al eliminar el recordatorio:", error);
    return await getStoredReminders();
  }
};
