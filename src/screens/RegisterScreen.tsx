import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../types";
import { registrarUsuario } from "../services/authStorage";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">;
};

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Atención", "Todos los campos son obligatorios.");
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        "Atención",
        "La contraseña debe tener al menos 6 caracteres.",
      );
      return;
    }
    if (password !== confirmPassword) {
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
        {/* Cabecera de Marca */}
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>MiAgenda</Text>

          <View style={styles.iconWrapper}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar-outline" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.badgeContainer}>
              <Feather name="bell" size={11} color="#2563EB" />
            </View>
          </View>

          <Text style={styles.brandSubtitle}>TU DÍA, BAJO CONTROL</Text>
        </View>

        {/* Tarjeta Flotante */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crear cuenta</Text>
          <Text style={styles.cardSubtitle}>
            Regístrate para organizar tus recordatorios.
          </Text>

          {/* Campo Usuario */}
          <Text style={styles.inputLabel}>Nombre de usuario</Text>
          <View style={styles.inputContainer}>
            <Feather
              name="user"
              size={18}
              color="#94A3B8"
              style={styles.inputIconLeft}
            />
            <TextInput
              style={styles.input}
              placeholder="Ej: cesar"
              placeholderTextColor="#94A3B8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Campo Contraseña */}
          <Text style={styles.inputLabel}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Feather
              name="lock"
              size={18}
              color="#94A3B8"
              style={styles.inputIconLeft}
            />
            <TextInput
              style={styles.input}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={18}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          {/* Confirmar Contraseña */}
          <Text style={styles.inputLabel}>Confirmar contraseña</Text>
          <View style={styles.inputContainer}>
            <Feather
              name="lock"
              size={18}
              color="#94A3B8"
              style={styles.inputIconLeft}
            />
            <TextInput
              style={styles.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather
                name={showConfirmPassword ? "eye" : "eye-off"}
                size={18}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          {/* Botón Principal */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryButtonText}>Registrarme</Text>
            <Feather
              name="chevron-right"
              size={18}
              color="#FFFFFF"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>

          {/* Enlace al Login */}
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
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  iconWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#2563EB",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    elevation: 3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 16,
  },
  inputIconLeft: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 18,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 4,
  },
  linkTextRegular: {
    fontSize: 13,
    color: "#64748B",
  },
  linkTextBold: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
