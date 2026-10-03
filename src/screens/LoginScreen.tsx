import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { validarLogin } from '../services/authStorage';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Atención', 'Por favor ingresa usuario y contraseña.');
      return;
    }

    const isValid = await validarLogin({ username: username.trim(), password });
    if (isValid) {
      navigation.replace('Home', { username: username.trim() });
    } else {
      Alert.alert('Acceso Denegado', 'Usuario o contraseña incorrectos.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Agenda & Recordatorios</Text>
      <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

      <CustomInput
        label="Nombre de usuario"
        placeholder="Ingresa tu usuario"
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

      <CustomButton title="Iniciar Sesión" onPress={handleLogin} />

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.linkText}>¿No tienes una cuenta? Regístrate aquí</Text>
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
    fontSize: 26,
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