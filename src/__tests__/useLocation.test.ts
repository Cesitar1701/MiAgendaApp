import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { useLocation } from "../hooks/useLocation";

jest.mock("expo-location", () => ({
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  Accuracy: {
    Balanced: 3,
  },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

describe("useLocation Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devuelve la ubicación con dirección cuando el permiso es concedido", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "granted",
      canAskAgain: true,
    });

    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
      coords: {
        latitude: -34.6037,
        longitude: -58.3816,
      },
    });

    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValueOnce([
      {
        street: "Av. Corrientes",
        streetNumber: "1234",
        city: "CABA",
        region: "Buenos Aires",
      },
    ]);

    const { result } = renderHook(() => useLocation());

    let locationResult;
    await act(async () => {
      locationResult = await result.current.obtenerUbicacionActual();
    });

    expect(locationResult).toEqual({
      latitude: -34.6037,
      longitude: -58.3816,
      address: "Av. Corrientes 1234, CABA, Buenos Aires",
    });
  });

  it("muestra alerta y no obtiene ubicación si el permiso es rechazado permanentemente", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");

    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "denied",
      canAskAgain: false,
    });

    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "denied",
      canAskAgain: false,
    });

    const { result } = renderHook(() => useLocation());

    let locationResult;
    await act(async () => {
      locationResult = await result.current.obtenerUbicacionActual();
    });

    expect(locationResult).toBeNull();
    expect(alertSpy).toHaveBeenCalledWith(
      "Permiso de ubicación desactivado",
      expect.stringContaining("Ajustes del dispositivo"),
      expect.any(Array),
    );
  });
});
