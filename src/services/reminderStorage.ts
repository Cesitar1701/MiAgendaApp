import AsyncStorage from "@react-native-async-storage/async-storage";
import { Reminder } from "../types";
import { obtenerSesionActiva } from "./authStorage";

const REMINDERS_KEY = "@reminders_list";

const isReminderRecord = (value: unknown): value is Reminder => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.isoDate === "string" &&
    typeof candidate.targetTimestamp === "number" &&
    typeof candidate.completed === "boolean"
  );
};

const getAllRemindersRaw = async (): Promise<Reminder[]> => {
  try {
    const json = await AsyncStorage.getItem(REMINDERS_KEY);
    if (!json) return [];
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isReminderRecord);
  } catch (error) {
    console.error("Error al leer recordatorios:", error);
    return [];
  }
};

const resolveUsername = async (username?: string): Promise<string | null> => {
  if (username && username.trim()) return username.trim();
  return await obtenerSesionActiva();
};

const belongsToUser = (
  reminder: Reminder,
  activeUser: string | null,
): boolean => {
  if (!activeUser) return true;
  if (!reminder.username) return false;
  return reminder.username.toLowerCase() === activeUser.toLowerCase();
};

const sortReminders = (list: Reminder[]): Reminder[] => {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.targetTimestamp - b.targetTimestamp;
  });
};

export const saveReminder = async (
  newReminder: Reminder,
  username?: string,
): Promise<Reminder[] | null> => {
  try {
    const activeUser = await resolveUsername(username ?? newReminder.username);
    const current = await getAllRemindersRaw();
    const reminderWithUser: Reminder = {
      ...newReminder,
      username: activeUser ?? newReminder.username,
    };
    const updatedAll = [reminderWithUser, ...current];
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedAll));
    return sortReminders(
      updatedAll.filter((r) => belongsToUser(r, activeUser)),
    );
  } catch (error) {
    console.error("Error al guardar recordatorio:", error);
    return null;
  }
};

export const updateReminder = async (
  updatedReminder: Reminder,
  username?: string,
): Promise<Reminder[] | null> => {
  try {
    const activeUser = await resolveUsername(
      username ?? updatedReminder.username,
    );
    const current = await getAllRemindersRaw();
    const updatedAll = current.map((r) =>
      r.id === updatedReminder.id
        ? {
            ...updatedReminder,
            username: activeUser ?? updatedReminder.username ?? r.username,
          }
        : r,
    );
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedAll));
    return sortReminders(
      updatedAll.filter((r) => belongsToUser(r, activeUser)),
    );
  } catch (error) {
    console.error("Error al actualizar recordatorio:", error);
    return null;
  }
};

export const getStoredReminders = async (
  username?: string,
): Promise<Reminder[]> => {
  try {
    const activeUser = await resolveUsername(username);
    const allReminders = await getAllRemindersRaw();
    const userReminders = allReminders.filter((r) =>
      belongsToUser(r, activeUser),
    );
    return sortReminders(userReminders);
  } catch (error) {
    console.error("Error al obtener recordatorios:", error);
    return [];
  }
};

export const removeReminder = async (
  id: string,
  username?: string,
): Promise<Reminder[]> => {
  try {
    const activeUser = await resolveUsername(username);
    const allReminders = await getAllRemindersRaw();
    const updatedAll = allReminders.filter((r) => r.id !== id);
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedAll));
    return sortReminders(
      updatedAll.filter((r) => belongsToUser(r, activeUser)),
    );
  } catch (error) {
    console.error("Error al eliminar el recordatorio:", error);
    return await getStoredReminders(username);
  }
};
