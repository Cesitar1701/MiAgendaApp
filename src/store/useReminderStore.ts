import { create } from "zustand";
import { Reminder } from "../types";
import {
  getStoredReminders,
  saveReminder,
  updateReminder as updateStoredReminder,
  removeReminder,
} from "../services/reminderStorage";

export interface ReminderStore {
  reminders: Reminder[];
  loading: boolean;
  loadReminders: (username?: string) => Promise<void>;
  addReminder: (reminder: Reminder, username?: string) => Promise<boolean>;
  updateReminder: (reminder: Reminder, username?: string) => Promise<boolean>;
  deleteReminder: (id: string, username?: string) => Promise<boolean>;
}

export const useReminderStore = create<ReminderStore>((set) => ({
  reminders: [],
  loading: false,

  loadReminders: async (username?: string) => {
    set({ loading: true });
    try {
      const stored = await getStoredReminders(username);
      set({ reminders: stored, loading: false });
    } catch (error) {
      console.error("Error al cargar recordatorios en el store:", error);
      set({ loading: false });
    }
  },

  addReminder: async (reminder: Reminder, username?: string) => {
    set({ loading: true });
    try {
      const targetUser = username ?? reminder.username;
      const success = await saveReminder(reminder, targetUser);
      if (success) {
        const stored = await getStoredReminders(targetUser);
        set({ reminders: stored, loading: false });
        return true;
      }
      set({ loading: false });
      return false;
    } catch (error) {
      console.error("Error al agregar recordatorio en el store:", error);
      set({ loading: false });
      return false;
    }
  },

  updateReminder: async (reminder: Reminder, username?: string) => {
    set({ loading: true });
    try {
      const targetUser = username ?? reminder.username;
      const success = await updateStoredReminder(reminder, targetUser);
      if (success) {
        const stored = await getStoredReminders(targetUser);
        set({ reminders: stored, loading: false });
        return true;
      }
      set({ loading: false });
      return false;
    } catch (error) {
      console.error("Error al actualizar recordatorio en el store:", error);
      set({ loading: false });
      return false;
    }
  },

  deleteReminder: async (id: string, username?: string) => {
    set({ loading: true });
    try {
      const updated = await removeReminder(id, username);
      set({ reminders: updated, loading: false });
      return true;
    } catch (error) {
      console.error("Error al eliminar recordatorio en el store:", error);
      set({ loading: false });
      return false;
    }
  },
}));

