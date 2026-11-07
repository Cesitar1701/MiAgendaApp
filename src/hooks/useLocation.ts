import { useState, useCallback, useRef } from "react";
import { Alert, Linking } from "react-native";
import * as Location from "expo-location";
import { ReminderLocation } from "../types";
import { requestPermissionSafely } from "../utils/permissionHelpers";

export function useLocation() {
    const [loading, setLoading] = useState<boolean>(false);
    const isBusyRef = useRef<boolean>(false);

    const solicitarPermisoUbicacion = useCallback(async (): Promise<boolean> => {
        try {
            const existing = await Location.getForegroundPermissionsAsync();
            let finalStatus = existing.status;
            let canAskAgain = existing.canAskAgain;

            if (existing.status !== Location.PermissionStatus.GRANTED) {
                if (existing.canAskAgain !== false) {
                    const requested = await requestPermissionSafely(
                        () => Location.requestForegroundPermissionsAsync(),
                        () => Location.getForegroundPermissionsAsync(),
                    );
                    finalStatus = requested.status;
                    canAskAgain = requested.canAskAgain;
                }
            }

            if (finalStatus !== Location.PermissionStatus.GRANTED) {
                if (!canAskAgain) {
                    Alert.alert(
                        "Permiso de ubicación desactivado",
                        "Debes habilitar el acceso a la ubicación desde los Ajustes del dispositivo para adjuntar tu lugar actual.",
                        [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
                        ],
                    );
                } else {
                    Alert.alert(
                        "Permiso denegado",
                        "No se puede obtener la ubicación sin conceder el permiso correspondiente.",
                    );
                }
                return false;
            }

            return true;
        } catch (error) {
            console.warn("[useLocation] Error al solicitar permisos:", error);
            Alert.alert(
                "Error",
                "Ocurrió un error al verificar los permisos de ubicación.",
            );
            return false;
        }
    }, []);

    const formatearDireccion = (geo: Location.LocationGeocodedAddress): string => {
        const calle = geo.street
            ? `${geo.street}${geo.streetNumber ? " " + geo.streetNumber : ""}`
            : "";
        const zona = geo.district || geo.subregion || geo.city || "";
        const region = geo.region || geo.country || "";

        const partes = [calle, zona, region].filter((p) => Boolean(p && p.trim()));
        return partes.length > 0 ? partes.join(", ") : "Ubicación detectada";
    };

    const obtenerDireccionDeCoordenadas = useCallback(
        async (coords: { latitude: number; longitude: number }): Promise<string> => {
            try {
                const geocoded = await Location.reverseGeocodeAsync({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                });

                if (geocoded && geocoded.length > 0) {
                    return formatearDireccion(geocoded[0]);
                }
                return `Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}`;
            } catch (geocodeError) {
                console.warn(
                    "[useLocation] No se pudo obtener la dirección exacta:",
                    geocodeError,
                );
                return `Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}`;
            }
        },
        [],
    );

    const obtenerUbicacionActual = useCallback(async (): Promise<ReminderLocation | null> => {
        if (isBusyRef.current) return null;
        isBusyRef.current = true;
        setLoading(true);

        try {
            const hasPermission = await solicitarPermisoUbicacion();
            if (!hasPermission) return null;
            // 1. Intentar obtener la última ubicación conocida que usan las demas apps y esta guardada en cache del telefono.(Responde en < 50ms)
            let coords: { latitude: number; longitude: number } | null = null;
            try {
                const lastKnown = await Location.getLastKnownPositionAsync();
                if (lastKnown?.coords) {
                    coords = {
                        latitude: lastKnown.coords.latitude,
                        longitude: lastKnown.coords.longitude,
                    };
                }
            } catch {
                // Fallback silencioso si no hay caché
            }
            // 2. Si no había en caché, consultar al sensor con precisión balanceada
            if (!coords) {
                const position = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
            }
            // 3. Obtener la dirección
            const address = await obtenerDireccionDeCoordenadas(coords);
            return {
                latitude: coords.latitude,
                longitude: coords.longitude,
                address,
            };
        } catch (error) {
            console.error("[useLocation] Error al obtener posición:", error);
            Alert.alert(
                "Ubicación no disponible",
                "Asegúrate de tener el GPS encendido e inténtalo nuevamente.",
            );
            return null;
        } finally {
            setLoading(false);
            isBusyRef.current = false;
        }
    }, [solicitarPermisoUbicacion, obtenerDireccionDeCoordenadas]);

    return {
        loading,
        solicitarPermisoUbicacion,
        obtenerUbicacionActual,
        obtenerDireccionDeCoordenadas,
    };
}
