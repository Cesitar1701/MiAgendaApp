import { create } from "zustand";
import {
  User,
  cerrarSesion,
  obtenerSesionActiva,
  registrarUsuario,
  validarLogin,
} from "../services/authStorage";
import { useReminderStore } from "./useReminderStore";

export interface AuthStore {
  user: string | null;
  isHydrated: boolean;
  loading: boolean;
  hydrateSession: () => Promise<void>;
  login: (credentials: User) => Promise<boolean>;
  register: (
    credentials: User,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isHydrated: false,
  loading: false,

  hydrateSession: async () => {
    try {
      const activeUser = await obtenerSesionActiva();
      set({ user: activeUser, isHydrated: true });
    } catch (error) {
      console.error("[useAuthStore] Error al hidratar sesión:", error);
      set({ user: null, isHydrated: true });
    }
  },

  login: async (credentials: User) => {
    set({ loading: true });
    try {
      const isValid = await validarLogin(credentials);
      if (isValid) {
        const cleanUser = credentials.username.trim();
        set({ user: cleanUser, loading: false });
        return true;
      }
      set({ loading: false });
      return false;
    } catch (error) {
      console.error("[useAuthStore] Error en login:", error);
      set({ loading: false });
      return false;
    }
  },

  register: async (credentials: User) => {
    set({ loading: true });
    try {
      const result = await registrarUsuario(credentials);
      set({ loading: false });
      return result;
    } catch {
      set({ loading: false });
      return { success: false, message: "Error al registrar el usuario" };
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await cerrarSesion();
      useReminderStore.getState().resetStore();
      set({ user: null, loading: false });
    } catch (error) {
      console.error("[useAuthStore] Error al cerrar sesión:", error);
      set({ loading: false });
    }
  },
}));

