import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import RootNavigator from "./src/navigation/RootNavigator";
import { useAuthStore } from "./src/store/useAuthStore";
import { setupNotificationListeners } from "./src/hooks/useLocalNotifications";

export default function App() {
  useEffect(() => {
    void useAuthStore.getState().hydrateSession();
    const cleanupNotifications = setupNotificationListeners();
    return cleanupNotifications;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
