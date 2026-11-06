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
                const requested = await requestPermissionSafely(
                    () => Location.requestForegroundPermissionsAsync(),
                    () => Location.getForegroundPermissionsAsync(),
                );
                finalStatus = requested.status;
                canAskAgain = requested.canAskAgain;
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
            Alert.alert("Error", "Ocurrió un error al verificar los permisos de ubicación.");
            return false;
        }
    }, []);

    const formatearDireccion = (geo: Location.LocationGeocodedAddress): string => {
        const calle = geo.street ? `${geo.street}${geo.streetNumber ? " " + geo.streetNumber : ""}` : "";
        const zona = geo.district || geo.subregion || geo.city || "";
        const region = geo.region || geo.country || "";

        const partes = [calle, zona, region].filter((p) => Boolean(p && p.trim()));
        return partes.length > 0 ? partes.join(", ") : "Ubicación detectada";
    };

    const obtenerUbicacionActual = useCallback(async (): Promise<ReminderLocation | null> => {
        if (isBusyRef.current) return null;
        isBusyRef.current = true;
        setLoading(true);

        try {
            const hasPermission = await solicitarPermisoUbicacion();
            if (!hasPermission) return null;

            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = position.coords;
            let address = "Ubicación seleccionada";

            try {
                const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (geocoded && geocoded.length > 0) {
                    address = formatearDireccion(geocoded[0]);
                }
            } catch (geocodeError) {
                console.warn("[useLocation] No se pudo obtener la dirección exacta:", geocodeError);
                address = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
            }

            return {
                latitude,
                longitude,
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
    }, [solicitarPermisoUbicacion]);

    return {
        loading,
        solicitarPermisoUbicacion,
        obtenerUbicacionActual,
    };
}