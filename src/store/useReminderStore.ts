import { create } from "zustand";
import { Reminder } from "../types";
import {
  getStoredReminders,
  saveReminder,
  updateReminder as updateStoredReminder,
  removeReminder,
} from "../services/reminderStorage";
import { useAuthStore } from "./useAuthStore";

export interface ReminderStore {
  reminders: Reminder[];
  loading: boolean;
  selectedDate: Date;
  isFilterActive: boolean;
  setSelectedDate: (date: Date) => void;
  setIsFilterActive: (active: boolean) => void;
  resetStore: () => void;
  loadReminders: (username?: string) => Promise<void>;
  addReminder: (reminder: Reminder, username?: string) => Promise<boolean>;
  updateReminder: (reminder: Reminder, username?: string) => Promise<boolean>;
  deleteReminder: (id: string, username?: string) => Promise<boolean>;
}

const resolveActiveUser = (
  explicitUser?: string,
  reminderUser?: string,
): string | undefined => {
  return explicitUser ?? reminderUser ?? useAuthStore.getState().user ?? undefined;
};

export const useReminderStore = create<ReminderStore>((set) => ({
  reminders: [],
  loading: false,
  selectedDate: new Date(),
  isFilterActive: true,

  setSelectedDate: (date: Date) => set({ selectedDate: date }),

  setIsFilterActive: (active: boolean) => set({ isFilterActive: active }),

  resetStore: () =>
    set({
      reminders: [],
      loading: false,
      selectedDate: new Date(),
      isFilterActive: true,
    }),

  loadReminders: async (username?: string) => {
    set({ loading: true });
    try {
      const targetUser = resolveActiveUser(username);
      const stored = await getStoredReminders(targetUser);
      set({ reminders: stored, loading: false });
    } catch (error) {
      console.error("Error al cargar recordatorios en el store:", error);
      set({ loading: false });
    }
  },

  addReminder: async (reminder: Reminder, username?: string) => {
    set({ loading: true });
    try {
      const targetUser = resolveActiveUser(username, reminder.username);
      const updatedList = await saveReminder(reminder, targetUser);
      if (updatedList) {
        set({ reminders: updatedList, loading: false });
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
      const targetUser = resolveActiveUser(username, reminder.username);
      const updatedList = await updateStoredReminder(reminder, targetUser);
      if (updatedList) {
        set({ reminders: updatedList, loading: false });
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
      const targetUser = resolveActiveUser(username);
      const updated = await removeReminder(id, targetUser);
      set({ reminders: updated, loading: false });
      return true;
    } catch (error) {
      console.error("Error al eliminar recordatorio en el store:", error);
      set({ loading: false });
      return false;
    }
  },
}));
