import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; //Libreria moderna de react-navigation para manejar safe area
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";

import { RootStackParamList, Reminder } from "../types";
import ReminderCard from "../components/ReminderCard";
import { cerrarSesion } from "../services/authStorage";
import {
  getStoredReminders,
  updateReminderStatus,
  removeReminder,
} from "../services/reminderStorage";
import { getFormattedCurrentDate } from "../utils/dateHelpers";
import { useLocalNotifications } from "../hooks/useLocalNotifications";
import { Platform } from "react-native";
import {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
  route: RouteProp<RootStackParamList, "Home">;
};

export default function HomeScreen({ navigation, route }: Props) {
  const { username } = route.params || { username: "Usuario" };
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const insets = useSafeAreaInsets();
  const { cancelarNotificacion } = useLocalNotifications();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFilterActive, setIsFilterActive] = useState<boolean>(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadData = async () => {
        const stored = await getStoredReminders();
        if (isActive) {
          setReminders(stored);
        }
      };
      loadData();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const formattedFilterDate = useMemo(() => {
    return selectedDate.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [selectedDate]);

  const headerDateLabel = useMemo(() => {
    return selectedDate
      .toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
      .toUpperCase();
  }, [selectedDate]);

  const displayedReminders = useMemo(() => {
    if (!isFilterActive) return reminders;

    return reminders.filter((r) => {
      const rDate = r.date.toLowerCase().replace(".", "");
      const fDate = formattedFilterDate.toLowerCase().replace(".", "");
      return rDate === fDate;
    });
  }, [reminders, isFilterActive, formattedFilterDate]);

  const pendingCount = useMemo(
    () => displayedReminders.filter((r) => !r.completed).length,
    [displayedReminders],
  );

  const handleOpenCalendar = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: "date",
        onValueChange: (_event, newDate?: Date) => {
          if (newDate) {
            setSelectedDate(newDate);
            setIsFilterActive(true); // Activa el filtro para el día elegido
          }
        },
      });
    }
  };

  const handleToggleComplete = async (id: string) => {
    const target = reminders.find((r) => r.id === id);
    if (target?.notificationId && !target.completed) {
      await cancelarNotificacion(target.notificationId);
    }
    const updated = await updateReminderStatus(id);
    setReminders(updated);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar Recordatorio",
      "¿Deseas eliminar este recordatorio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const target = reminders.find((r) => r.id === id);
            if (target?.notificationId) {
              await cancelarNotificacion(target.notificationId);
            }
            const updated = await removeReminder(id);
            setReminders(updated);
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    await cerrarSesion();
    navigation.replace("Login");
  };

  // Cálculo memoizado de pendientes y fecha actual
  /* const pendingCount = useMemo(
    () => reminders.filter((r) => !r.completed).length,
    [reminders],
  ); */
  const currentDate = useMemo(() => getFormattedCurrentDate(), []);

  return (
    <View style={styles.container}>
      {/* Header Azul Curvado */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <Text style={styles.greeting}>Hola, {username}</Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
              accessibilityLabel="Cerrar sesión"
            >
              <Feather name="log-out" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{headerDateLabel}</Text>
            <TouchableOpacity
              style={styles.calendarIconContainer}
              onPress={handleOpenCalendar}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Contenido Principal */}
      <View style={styles.body}>
        <View style={styles.counterRow}>
          <View style={styles.tareaPendiente}>
            <Text style={styles.counterTitle}>Tareas pendientes</Text>
            <Text style={styles.counterNumber}>{pendingCount}</Text>
          </View>

          {/* Botón para alternar entre ver el día seleccionado o ver todas las tareas */}
          <TouchableOpacity
            onPress={() => setIsFilterActive(!isFilterActive)}
            style={[
              styles.filterChip,
              !isFilterActive && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                !isFilterActive && styles.filterChipTextActive,
              ]}
            >
              {isFilterActive ? "Ver todas" : "Ver hoy"}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={displayedReminders} // <--- Usa la lista filtrada
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReminderCard
              reminder={item}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isFilterActive
                  ? "No hay tareas programadas para este día"
                  : "No tienes tareas registradas"}
              </Text>
              <Text style={styles.emptySubtext}>
                Toca el botón + para agregar una nueva
              </Text>
            </View>
          }
        />
      </View>

      {/* Botón Flotante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("Create")}
        activeOpacity={0.85}
        accessibilityLabel="Crear nuevo recordatorio"
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#1E40AF",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  headerContent: {
    paddingTop: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  tareaPendiente: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  calendarIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    /*  alignItems: "center", */
    marginBottom: 16,
  },
  counterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  counterNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2563EB",
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtext: {
    color: "#94A3B8",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  filterChip: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  filterChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
});
