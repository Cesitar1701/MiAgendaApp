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
import { registrarUsuario, validarRegistro } from "../services/authStorage";
import AuthBrandHeader from "../components/AuthBrandHeader";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { COLORS, RADIUS } from "../constants/theme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">;
};

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    const validacion = validarRegistro(username, password, confirmPassword);
    if (validacion === "Campos vacíos") {
      Alert.alert("Atención", "Todos los campos son obligatorios.");
      return;
    }
    if (validacion === "Contraseña muy corta") {
      Alert.alert(
        "Atención",
        "La contraseña debe tener al menos 6 caracteres.",
      );
      return;
    }
    if (validacion === "Las contraseñas no coinciden") {
      Alert.alert("Atención", "Las contraseñas no coinciden.");
      return;
    }

    const result = await registrarUsuario({
      username: username.trim(),
      password,
    });
    if (result.success) {
      Alert.alert("Éxito", result.message, [
        {
          text: "Ir a Iniciar Sesión",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } else {
      Alert.alert("Error", result.message);
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
          <Text style={styles.cardTitle}>Crear cuenta</Text>
          <Text style={styles.cardSubtitle}>
            Regístrate para organizar tus recordatorios.
          </Text>

          <CustomInput
            label="Nombre de usuario"
            leftIcon="user"
            placeholder="Ej: cesar"
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

          <CustomInput
            label="Confirmar contraseña"
            leftIcon="lock"
            isPassword
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <CustomButton
            title="Registrarme"
            rightIcon="chevron-right"
            onPress={handleRegister}
            style={styles.submitButton}
          />

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkTextRegular}>
              ¿Ya tienes una cuenta?{" "}
              <Text style={styles.linkTextBold}>Inicia sesión</Text>
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
    paddingTop: 26,
    paddingBottom: 22,
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
    marginBottom: 20,
  },
  submitButton: {
    marginTop: 6,
    marginBottom: 18,
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
