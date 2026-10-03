import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { registrarUsuario } from '../services/authStorage';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
 
  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Atención', 'Todos los campos son obligatorios.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atención', 'Las contraseñas no coinciden.');
      return;
    }

    const result = await registrarUsuario({ username: username.trim(), password });
    if (result.success) {
      Alert.alert('Éxito', result.message, [
        { text: 'Ir a Iniciar Sesión', onPress: () => navigation.navigate('Login') },
      ]);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      <Text style={styles.subtitle}>Regístrate para organizar tus recordatorios</Text>

      <CustomInput
        label="Nombre de usuario"
        placeholder="Ej: cesar"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <CustomInput
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <CustomInput
        label="Confirmar contraseña"
        placeholder="••••••••"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <CustomButton title="Registrarme" onPress={handleRegister} />

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.linkText}>¿Ya tienes una cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#4338CA',
    fontSize: 14,
    fontWeight: '600',
  },
});