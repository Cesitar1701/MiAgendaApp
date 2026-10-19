import AsyncStorage from "@react-native-async-storage/async-storage";
import { Reminder } from "../types";
import { obtenerSesionActiva } from "./authStorage";

const REMINDERS_KEY = "@reminders_list";

const getAllRemindersRaw = async (): Promise<Reminder[]> => {
  try {
    const json = await AsyncStorage.getItem(REMINDERS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error("Error al leer recordatorios:", error);
    return [];
  }
};

const resolveUsername = async (username?: string): Promise<string | null> => {
  if (username && username.trim()) return username.trim();
  return await obtenerSesionActiva();
};

const belongsToUser = (reminder: Reminder, activeUser: string | null): boolean => {
  if (!activeUser) return true;
  if (!reminder.username) return false;
  return reminder.username.toLowerCase() === activeUser.toLowerCase();
};

const sortReminders = (list: Reminder[]): Reminder[] => {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    if (a.targetTimestamp && b.targetTimestamp) {
      return a.targetTimestamp - b.targetTimestamp;
    }
    return 0;
  });
};

export const saveReminder = async (
  newReminder: Reminder,
  username?: string,
): Promise<boolean> => {
  try {
    const activeUser = await resolveUsername(username ?? newReminder.username);
    const current = await getAllRemindersRaw();
    const reminderWithUser: Reminder = {
      ...newReminder,
      username: activeUser ?? newReminder.username,
    };
    const updated = [reminderWithUser, ...current];
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("Error al guardar recordatorio:", error);
    return false;
  }
};

export const updateReminder = async (
  updatedReminder: Reminder,
  username?: string,
): Promise<boolean> => {
  try {
    const activeUser = await resolveUsername(
      username ?? updatedReminder.username,
    );
    const current = await getAllRemindersRaw();
    const updated = current.map((r) =>
      r.id === updatedReminder.id
        ? {
            ...updatedReminder,
            username: activeUser ?? updatedReminder.username ?? r.username,
          }
        : r,
    );
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("Error al actualizar recordatorio:", error);
    return false;
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

export const updateReminderStatus = async (
  id: string,
  username?: string,
  newNotificationId?: string | null,
): Promise<Reminder[]> => {
  try {
    const activeUser = await resolveUsername(username);
    const allReminders = await getAllRemindersRaw();
    const updatedAll = allReminders.map((r) => {
      if (r.id !== id) return r;
      const nextCompleted = !r.completed;
      return {
        ...r,
        completed: nextCompleted,
        notificationId:
          newNotificationId !== undefined
            ? newNotificationId
            : nextCompleted
              ? null
              : r.notificationId,
      };
    });
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedAll));
    return sortReminders(
      updatedAll.filter((r) => belongsToUser(r, activeUser)),
    );
  } catch (error) {
    console.error("Error al actualizar el estado del recordatorio:", error);
    return await getStoredReminders(username);
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
