import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, Feather } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import { RootStackParamList } from "../types";
import ReminderCard from "../components/ReminderCard";
import { cerrarSesion } from "../services/authStorage";
import {
  toISODateString,
  formatDisplayDate,
  getFormattedCurrentDate,
  isSameDay,
  resolveReminderIsoDate,
  isTodayOrFutureReminder,
} from "../utils/dateHelpers";
import { useReminders } from "../hooks/useReminders";
import { COLORS, RADIUS } from "../constants/theme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
  route: RouteProp<RootStackParamList, "Home">;
};

export default function HomeScreen({ navigation, route }: Props) {
  const { username } = route.params || { username: "Usuario" };
  const insets = useSafeAreaInsets();
  const {
    reminders,
    toggleComplete,
    confirmAndDelete,
    cancelUserNotifications,
  } = useReminders(username);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFilterActive, setIsFilterActive] = useState<boolean>(true);
  const [showIOSCalendar, setShowIOSCalendar] = useState<boolean>(false);

  const selectedIsoDate = useMemo(
    () => toISODateString(selectedDate),
    [selectedDate],
  );

  const formattedFilterDate = useMemo(
    () => formatDisplayDate(selectedDate),
    [selectedDate],
  );

  const headerDateLabel = useMemo(
    () => getFormattedCurrentDate(selectedDate),
    [selectedDate],
  );

  const isSelectedDateToday = useMemo(
    () => isSameDay(selectedDate, new Date()),
    [selectedDate],
  );

  const displayedReminders = useMemo(() => {
    if (!isFilterActive) {
      const now = new Date();
      return reminders.filter((r) => isTodayOrFutureReminder(r, now));
    }

    return reminders.filter((r) => {
      const reminderIso = resolveReminderIsoDate(r);
      if (reminderIso) {
        return reminderIso === selectedIsoDate;
      }
      const rDate = r.date.toLowerCase().replace(/\./g, "");
      const fDate = formattedFilterDate.toLowerCase().replace(/\./g, "");
      return rDate === fDate;
    });
  }, [reminders, isFilterActive, selectedIsoDate, formattedFilterDate]);

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
            setIsFilterActive(true);
          }
        },
      });
    } else {
      setShowIOSCalendar(true);
    }
  };

  const handleLogout = async () => {
    await cancelUserNotifications();
    await cerrarSesion();
    navigation.replace("Login");
  };

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
              <Feather name="log-out" size={18} color={COLORS.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{headerDateLabel}</Text>
            <TouchableOpacity
              style={styles.calendarIconContainer}
              onPress={handleOpenCalendar}
              activeOpacity={0.7}
              accessibilityLabel="Seleccionar fecha en el calendario"
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color={COLORS.surface}
              />
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
              {isFilterActive
                ? "Ver todo"
                : isSelectedDateToday
                  ? "Ver hoy"
                  : "Ver día elegido"}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={displayedReminders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReminderCard
              reminder={item}
              onToggleComplete={toggleComplete}
              onDelete={confirmAndDelete}
              onPress={(selectedReminder) =>
                navigation.navigate("Create", {
                  username,
                  reminder: selectedReminder,
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isFilterActive
                  ? "No hay tareas programadas para este día"
                  : "No tienes tareas próximas registradas"}
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
        onPress={() => navigation.navigate("Create", { username })}
        activeOpacity={0.85}
        accessibilityLabel="Crear nuevo recordatorio"
      >
        <Feather name="plus" size={28} color={COLORS.surface} />
      </TouchableOpacity>

      {/* Modal de Calendario para iOS */}
      {Platform.OS !== "android" && (
        <Modal
          visible={showIOSCalendar}
          transparent
          animationType="fade"
          onRequestClose={() => setShowIOSCalendar(false)}
        >
          <TouchableOpacity
            style={styles.iosModalOverlay}
            activeOpacity={1}
            onPress={() => setShowIOSCalendar(false)}
          >
            <View style={styles.iosModalCard}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                onChange={(_event, newDate) => {
                  if (newDate) {
                    setSelectedDate(newDate);
                    setIsFilterActive(true);
                  }
                }}
              />
              <TouchableOpacity
                style={styles.iosModalDoneButton}
                onPress={() => setShowIOSCalendar(false)}
              >
                <Text style={styles.iosModalDoneText}>Listo</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    borderBottomLeftRadius: RADIUS.header,
    borderBottomRightRadius: RADIUS.header,
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
    color: COLORS.surface,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.whiteOverlay,
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
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  calendarIconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.whiteOverlay,
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
    alignItems: "center",
    marginBottom: 16,
  },
  counterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  counterNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtext: {
    color: COLORS.textPlaceholder,
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  filterChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  filterChipTextActive: {
    color: COLORS.surface,
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iosModalCard: {
    width: "90%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    alignItems: "center",
  },
  iosModalDoneButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: RADIUS.md,
  },
  iosModalDoneText: {
    color: COLORS.surface,
    fontWeight: "700",
    fontSize: 14,
  },
});
