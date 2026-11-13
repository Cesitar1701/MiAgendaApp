import { Alert, AppState, Linking } from "react-native";

export interface PermissionAlertMessages {
  blockedTitle: string;
  blockedMessage: string;
  deniedTitle?: string;
  deniedMessage?: string;
}

/**
 * Ejecuta una solicitud de permisos nativos protegiendo contra el comportamiento
 * de Android donde tocar fuera del diálogo del sistema cancela el popup pero
 * puede dejar la promesa nativa en estado "pending" indefinidamente.
 */
export async function requestPermissionSafely<T>(
  requestFn: () => Promise<T>,
  getFn: () => Promise<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      subscription.remove();
    };

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && !settled) {
        resumeTimer = setTimeout(async () => {
          if (!settled) {
            settled = true;
            cleanup();
            try {
              const current = await getFn();
              resolve(current);
            } catch (err) {
              reject(err);
            }
          }
        }, 500);
      }
    });

    requestFn()
      .then((res) => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve(res);
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(err);
        }
      });
  });
}

/**
 * Muestra la alerta apropiada cuando un permiso es denegado o bloqueado permanentemente.
 */
export function showPermissionAlert(
  canAskAgain: boolean | undefined,
  messages: PermissionAlertMessages,
): void {
  if (canAskAgain === false) {
    Alert.alert(messages.blockedTitle, messages.blockedMessage, [
      { text: "Cancelar", style: "cancel" },
      { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
    ]);
  } else if (messages.deniedTitle && messages.deniedMessage) {
    Alert.alert(messages.deniedTitle, messages.deniedMessage);
  }
}
