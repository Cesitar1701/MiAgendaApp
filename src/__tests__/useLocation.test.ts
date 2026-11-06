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

    it("resuelve la dirección de coordenadas correctamente con obtenerDireccionDeCoordenadas", async () => {
        (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValueOnce([
            {
                street: "Calle Florida",
                streetNumber: "500",
                district: "San Nicolás",
                city: "CABA",
            },
        ]);

        const { result } = renderHook(() => useLocation());

        let address = "";
        await act(async () => {
            address = await result.current.obtenerDireccionDeCoordenadas({
                latitude: -34.6015,
                longitude: -58.3755,
            });
        });

        expect(address).toBe("Calle Florida 500, San Nicolás");
        expect(Location.reverseGeocodeAsync).toHaveBeenCalledWith({
            latitude: -34.6015,
            longitude: -58.3755,
        });
    });

    it("devuelve coordenadas formateadas si la geocodificación inversa falla o no devuelve datos", async () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        (Location.reverseGeocodeAsync as jest.Mock).mockRejectedValueOnce(
            new Error("Network geocoding failed"),
        );

        const { result } = renderHook(() => useLocation());

        let address = "";
        await act(async () => {
            address = await result.current.obtenerDireccionDeCoordenadas({
                latitude: -34.6015,
                longitude: -58.3755,
            });
        });

        expect(address).toBe("Lat: -34.6015, Lon: -58.3755");
        warnSpy.mockRestore();
    });

    it("muestra alerta y no obtiene ubicación si el permiso es rechazado normalmente (canAskAgain: true)", async () => {
        const alertSpy = jest.spyOn(Alert, "alert");

        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
            status: "undetermined",
            canAskAgain: true,
        });

        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
            status: "denied",
            canAskAgain: true,
        });

        const { result } = renderHook(() => useLocation());

        let locationResult;
        await act(async () => {
            locationResult = await result.current.obtenerUbicacionActual();
        });

        expect(locationResult).toBeNull();
        expect(alertSpy).toHaveBeenCalledWith(
            "Permiso denegado",
            "No se puede obtener la ubicación sin conceder el permiso correspondiente.",
        );
    });

    it("muestra alerta y no obtiene ubicación si el permiso es rechazado permanentemente (!canAskAgain)", async () => {
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

    it("maneja error cuando falla la obtención de posición GPS", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const alertSpy = jest.spyOn(Alert, "alert");

        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
            status: "granted",
            canAskAgain: true,
        });

        (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValueOnce(
            new Error("GPS unavailable"),
        );

        const { result } = renderHook(() => useLocation());

        let locationResult;
        await act(async () => {
            locationResult = await result.current.obtenerUbicacionActual();
        });

        expect(locationResult).toBeNull();
        expect(alertSpy).toHaveBeenCalledWith(
            "Ubicación no disponible",
            expect.stringContaining("GPS"),
        );
        errorSpy.mockRestore();
    });
});
