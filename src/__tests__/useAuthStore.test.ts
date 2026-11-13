import { act } from "@testing-library/react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useReminderStore } from "../store/useReminderStore";
import * as authStorage from "../services/authStorage";
import { Reminder } from "../types";

jest.mock(
  "@react-native-async-storage/async-storage",
  () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../services/authStorage");

describe("useAuthStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, isHydrated: false, loading: false });
    useReminderStore.setState({ reminders: [], loading: false });
  });

  it("hydrateSession carga el usuario activo y marca isHydrated como true", async () => {
    (authStorage.obtenerSesionActiva as jest.Mock).mockResolvedValueOnce(
      "cesar",
    );

    await act(async () => {
      await useAuthStore.getState().hydrateSession();
    });

    expect(authStorage.obtenerSesionActiva).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBe("cesar");
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });

  it("hydrateSession establece user en null si falla la lectura", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (authStorage.obtenerSesionActiva as jest.Mock).mockRejectedValueOnce(
      new Error("Storage read error"),
    );

    await act(async () => {
      await useAuthStore.getState().hydrateSession();
    });

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isHydrated).toBe(true);
    jest.restoreAllMocks();
  });

  it("login actualiza el usuario autenticado cuando las credenciales son válidas", async () => {
    (authStorage.validarLogin as jest.Mock).mockResolvedValueOnce(true);

    let success = false;
    await act(async () => {
      success = await useAuthStore
        .getState()
        .login({ username: "  cesar  ", password: "secret123" });
    });

    expect(success).toBe(true);
    expect(useAuthStore.getState().user).toBe("cesar");
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it("login retorna false y mantiene user en null cuando las credenciales son inválidas", async () => {
    (authStorage.validarLogin as jest.Mock).mockResolvedValueOnce(false);

    let success = true;
    await act(async () => {
      success = await useAuthStore
        .getState()
        .login({ username: "cesar", password: "wrong" });
    });

    expect(success).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it("register delega en registrarUsuario y retorna su resultado", async () => {
    (authStorage.registrarUsuario as jest.Mock).mockResolvedValueOnce({
      success: true,
      message: "Usuario registrado exitosamente",
    });

    let response = { success: false, message: "" };
    await act(async () => {
      response = await useAuthStore
        .getState()
        .register({ username: "nuevo", password: "password123" });
    });

    expect(response).toEqual({
      success: true,
      message: "Usuario registrado exitosamente",
    });
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it("logout cierra sesión, limpia user y resetea useReminderStore", async () => {
    const sampleReminder: Reminder = {
      id: "1",
      title: "Tarea",
      description: "",
      date: "12 nov 2026",
      isoDate: "2026-11-12",
      time: "10:00",
      targetTimestamp: 1794488400000,
      category: "trabajo",
      completed: false,
      username: "cesar",
    };

    useAuthStore.setState({ user: "cesar", isHydrated: true });
    useReminderStore.setState({
      reminders: [sampleReminder],
      isFilterActive: false,
    });
    (authStorage.cerrarSesion as jest.Mock).mockResolvedValueOnce(undefined);

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    expect(authStorage.cerrarSesion).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useReminderStore.getState().reminders).toEqual([]);
    expect(useReminderStore.getState().isFilterActive).toBe(true);
  });
});

