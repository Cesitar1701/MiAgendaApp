import { useCallback, useRef } from "react";
import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { requestPermissionSafely } from "../utils/permissionHelpers";

export function useCamera() {
  const isBusyRef = useRef(false);

  const solicitarPermisoCamara = useCallback(async (): Promise<boolean> => {
    try {
      const existing = await ImagePicker.getCameraPermissionsAsync();
      let finalStatus = existing.status;
      let canAskAgain = existing.canAskAgain;

      if (existing.status !== "granted") {
        const requested = await requestPermissionSafely(
          () => ImagePicker.requestCameraPermissionsAsync(),
          () => ImagePicker.getCameraPermissionsAsync(),
        );
        finalStatus = requested.status;
        canAskAgain = requested.canAskAgain;
      }

      if (finalStatus !== "granted") {
        // Solo mostramos la alerta si el usuario rechazó explícitamente o bloqueó el permiso
        if (!canAskAgain) {
          Alert.alert(
            "Permiso de cámara desactivado",
            "Debes habilitar el acceso a la cámara desde los Ajustes del dispositivo.",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
            ],
          );
        }
        return false;
      }

      return true;
    } catch (error) {
      console.warn("[useCamera] Error al solicitar permisos de cámara:", error);
      return false;
    }
  }, []);

  const tomarFoto = useCallback(async (): Promise<string | null> => {
    if (isBusyRef.current) return null;
    isBusyRef.current = true;

    try {
      const hasPermission = await solicitarPermisoCamara();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error("[useCamera] Error al abrir la cámara:", error);
      Alert.alert("Error", "No se pudo abrir la cámara en este dispositivo.");
      return null;
    } finally {
      isBusyRef.current = false;
    }
  }, [solicitarPermisoCamara]);

  const elegirDeGaleria = useCallback(async (): Promise<string | null> => {
    if (isBusyRef.current) return null;
    isBusyRef.current = true;

    try {
      const existing = await ImagePicker.getMediaLibraryPermissionsAsync();
      let finalStatus = existing.status;
      let canAskAgain = existing.canAskAgain;

      if (existing.status !== "granted") {
        const requested = await requestPermissionSafely(
          () => ImagePicker.requestMediaLibraryPermissionsAsync(),
          () => ImagePicker.getMediaLibraryPermissionsAsync(),
        );
        finalStatus = requested.status;
        canAskAgain = requested.canAskAgain;
      }

      if (finalStatus !== "granted") {
        if (!canAskAgain) {
          Alert.alert(
            "Permiso de galería desactivado",
            "El acceso a fotos está desactivado. Habilítalo desde Ajustes.",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
            ],
          );
        }
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error("[useCamera] Error al abrir la galería:", error);
      Alert.alert("Error", "No se pudo abrir la galería de imágenes.");
      return null;
    } finally {
      isBusyRef.current = false;
    }
  }, []);

  return {
    tomarFoto,
    elegirDeGaleria,
  };
}
