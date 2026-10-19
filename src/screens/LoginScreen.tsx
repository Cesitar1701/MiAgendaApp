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
import { validarLogin } from "../services/authStorage";
import AuthBrandHeader from "../components/AuthBrandHeader";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { COLORS, RADIUS } from "../constants/theme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Atención", "Por favor ingresa usuario y contraseña.");
      return;
    }

    const isValid = await validarLogin({ username: username.trim(), password });
    if (isValid) {
      navigation.replace("Home", { username: username.trim() });
    } else {
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
            title="Iniciar sesión"
            rightIcon="chevron-right"
            onPress={handleLogin}
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
