import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Tipos y Servicios
import { RootStackParamList } from "./src/types";
import { obtenerSesionActiva } from "./src/services/authStorage";

// Pantallas
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CreateScreen from "./src/screens/CreateScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    obtenerSesionActiva()
      .then((user) => {
        if (mounted) {
          setSessionUser(user);
          setIsCheckingSession(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsCheckingSession(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (isCheckingSession) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={sessionUser ? "Home" : "Login"}
          screenOptions={{
            headerStyle: {
              backgroundColor: "#F8FAFC",
            },
            headerTintColor: "#1E293B",
            headerTitleStyle: {
              fontWeight: "700",
            },
            contentStyle: {
              backgroundColor: "#F8FAFC",
            },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            initialParams={sessionUser ? { username: sessionUser } : undefined}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Create"
            component={CreateScreen}
            options={{
              presentation: "transparentModal",
              animation: "fade",
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
});
