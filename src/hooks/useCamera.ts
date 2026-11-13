import { useCallback, useRef } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  PermissionAlertMessages,
  requestPermissionSafely,
  showPermissionAlert,
} from "../utils/permissionHelpers";

const CAMERA_ALERT: PermissionAlertMessages = {
  blockedTitle: "Permiso de cámara desactivado",
  blockedMessage:
    "Debes habilitar el acceso a la cámara desde los Ajustes del dispositivo.",
};

const GALLERY_ALERT: PermissionAlertMessages = {
  blockedTitle: "Permiso de galería desactivado",
  blockedMessage:
    "El acceso a fotos está desactivado. Habilítalo desde Ajustes.",
};

async function ensureMediaPermission(
  getFn: () => Promise<ImagePicker.PermissionResponse>,
  requestFn: () => Promise<ImagePicker.PermissionResponse>,
  alertMessages: PermissionAlertMessages,
): Promise<boolean> {
  const existing = await getFn();
  let finalStatus = existing.status;
  let canAskAgain = existing.canAskAgain;

  if (existing.status !== ImagePicker.PermissionStatus.GRANTED) {
    const requested = await requestPermissionSafely(requestFn, getFn);
    finalStatus = requested.status;
    canAskAgain = requested.canAskAgain;
  }

  if (finalStatus !== ImagePicker.PermissionStatus.GRANTED) {
    showPermissionAlert(canAskAgain, alertMessages);
    return false;
  }

  return true;
}

export function useCamera() {
  const isBusyRef = useRef(false);

  const tomarFoto = useCallback(async (): Promise<string | null> => {
    if (isBusyRef.current) return null;
    isBusyRef.current = true;

    try {
      const hasPermission = await ensureMediaPermission(
        () => ImagePicker.getCameraPermissionsAsync(),
        () => ImagePicker.requestCameraPermissionsAsync(),
        CAMERA_ALERT,
      );
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
  }, []);

  const elegirDeGaleria = useCallback(async (): Promise<string | null> => {
    if (isBusyRef.current) return null;
    isBusyRef.current = true;

    try {
      const hasPermission = await ensureMediaPermission(
        () => ImagePicker.getMediaLibraryPermissionsAsync(),
        () => ImagePicker.requestMediaLibraryPermissionsAsync(),
        GALLERY_ALERT,
      );
      if (!hasPermission) return null;

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
