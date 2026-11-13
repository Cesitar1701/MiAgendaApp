import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import AuthBrandHeader from "../components/auth/AuthBrandHeader";
import CustomInput from "../components/ui/CustomInput";
import CustomButton from "../components/ui/CustomButton";
import { COLORS, RADIUS } from "../constants/theme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Atención", "Por favor ingresa usuario y contraseña.");
      return;
    }

    const isValid = await login({ username: username.trim(), password });
    if (!isValid) {
      Alert.alert("Acceso Denegado", "Usuario o contraseña incorrectos.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthBrandHeader />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bienvenido de nuevo</Text>
          <Text style={styles.cardSubtitle}>
            Ingresa tus datos para ver tu agenda.
          </Text>

          <CustomInput
            label="Nombre de usuario"
            leftIcon="user"
            placeholder="Tu nombre"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <CustomInput
            label="Contraseña"
            leftIcon="lock"
            isPassword
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
          />

          <CustomButton
            title={loading ? "Ingresando..." : "Iniciar sesión"}
            rightIcon="chevron-right"
            onPress={handleLogin}
            disabled={loading}
            style={styles.submitButton}
          />

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkTextRegular}>
              ¿No tienes una cuenta?{" "}
              <Text style={styles.linkTextBold}>Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSubtle,
    marginBottom: 22,
  },
  submitButton: {
    marginTop: 6,
    marginBottom: 20,
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 4,
  },
  linkTextRegular: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
