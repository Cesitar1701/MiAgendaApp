import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import CustomButton from '../components/CustomButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  route: RouteProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation, route }: Props) {
  // Recibimos el nombre del usuario que inició sesión
  const { username } = route.params || { username: 'Usuario' };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>¡Hola, {username}!</Text>
      <Text style={styles.subtitle}>Aquí aparecerán tus recordatorios.</Text>

      <View style={styles.actions}>
        <CustomButton
          title="+ Nuevo Recordatorio"
          onPress={() => navigation.navigate('Create')}
        />
        <CustomButton
          title="Cerrar Sesión"
          variant="secondary"
          onPress={() => navigation.replace('Login')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 30,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
});