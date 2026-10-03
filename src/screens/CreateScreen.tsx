import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import CustomButton from '../components/CustomButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Create'>;
};

export default function CreateScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo Recordatorio</Text>
      <Text style={styles.subtitle}>Aquí estara el formulario para crear un nuevo recordatorio.</Text>

      <CustomButton
        title="Volver"
        variant="secondary"
        onPress={() => navigation.goBack()}
      />
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
});