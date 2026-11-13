import { useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import * as Contacts from "expo-contacts/legacy";
import { ReminderContact } from "../types";
import {
  requestPermissionSafely,
  showPermissionAlert,
} from "../utils/permissionHelpers";

export function useDeviceContacts() {
  const [contacts, setContacts] = useState<ReminderContact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const isBusyRef = useRef<boolean>(false);

  const solicitarPermisoContactos = useCallback(async (): Promise<boolean> => {
    try {
      if (Contacts.isAvailableAsync) {
        const available = await Contacts.isAvailableAsync();
        if (!available) {
          Alert.alert(
            "Servicio no disponible",
            "El acceso a los contactos no está disponible en este dispositivo o entorno.",
          );
          return false;
        }
      }

      const existing = await Contacts.getPermissionsAsync();
      let canAskAgain = existing.canAskAgain;
      let isGranted =
        existing.status === Contacts.PermissionStatus.GRANTED ||
        existing.granted;

      if (!isGranted && existing.canAskAgain !== false) {
        const requested = await requestPermissionSafely(
          () => Contacts.requestPermissionsAsync(),
          () => Contacts.getPermissionsAsync(),
        );
        canAskAgain = requested.canAskAgain;
        isGranted =
          requested.status === Contacts.PermissionStatus.GRANTED ||
          requested.granted;
      }

      if (!isGranted) {
        showPermissionAlert(canAskAgain, {
          blockedTitle: "Permiso de contactos desactivado",
          blockedMessage:
            "Debes habilitar el acceso a los contactos desde los Ajustes del dispositivo para asociar contactos a tus recordatorios.",
          deniedTitle: "Permiso denegado",
          deniedMessage:
            "No se puede acceder a la agenda sin conceder el permiso correspondiente.",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.warn("[useDeviceContacts] Error al solicitar permisos:", error);
      Alert.alert(
        "Error",
        "Ocurrió un error al verificar los permisos de contactos.",
      );
      return false;
    }
  }, []);

  const formatearContactos = (
    rawContacts: Contacts.Contact[],
  ): ReminderContact[] => {
    const mapeados: ReminderContact[] = [];

    for (const c of rawContacts) {
      const fullName =
        c.name?.trim() ||
        [c.firstName, c.lastName].filter(Boolean).join(" ").trim();

      const phone = c.phoneNumbers?.[0]?.number?.trim();
      const email = c.emails?.[0]?.email?.trim();

      if (fullName || phone || email) {
        mapeados.push({
          name: fullName || phone || "Contacto sin nombre",
          phone: phone || undefined,
          email: email || undefined,
        });
      }
    }

    return mapeados.sort((a, b) => a.name.localeCompare(b.name));
  };

  const cargarContactos = useCallback(async (): Promise<ReminderContact[]> => {
    if (isBusyRef.current) return [];
    isBusyRef.current = true;
    setLoading(true);

    try {
      const hasPermission = await solicitarPermisoContactos();
      if (!hasPermission) {
        setContacts([]);
        return [];
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      const listaFormateada = formatearContactos(data || []);
      setContacts(listaFormateada);
      return listaFormateada;
    } catch (error) {
      console.warn("[useDeviceContacts] Error al leer contactos:", error);
      Alert.alert(
        "Error",
        "No se pudieron obtener los contactos del dispositivo.",
      );
      setContacts([]);
      return [];
    } finally {
      setLoading(false);
      isBusyRef.current = false;
    }
  }, [solicitarPermisoContactos]);

  return {
    contacts,
    loading,
    solicitarPermisoContactos,
    cargarContactos,
  };
}
