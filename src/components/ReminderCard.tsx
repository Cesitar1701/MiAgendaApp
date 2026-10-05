import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Reminder } from "../types";
import { CATEGORIAS } from "../constants/categories";

interface Props {
  reminder: Reminder;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ReminderCard({
  reminder,
  onToggleComplete,
  onDelete,
}: Props) {
  const categoryConfig = CATEGORIAS[reminder.category] || CATEGORIAS.personal;

  return (
    <View style={[styles.card, reminder.completed && styles.cardCompleted]}>
      {/* Encabezado: Título, Badge de Categoría y Checkbox */}
      <View style={styles.headerRow}>
        <Text
          style={[styles.title, reminder.completed && styles.titleCompleted]}
          numberOfLines={1}
        >
          {reminder.title}
        </Text>

        <View style={styles.rightActions}>
          <View style={[styles.badge, { backgroundColor: categoryConfig.bg }]}>
            <Ionicons
              name={categoryConfig.icon}
              size={12}
              color={categoryConfig.text}
            />
            <Text style={[styles.badgeText, { color: categoryConfig.text }]}>
              {categoryConfig.label}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.checkbox,
              reminder.completed && styles.checkboxCompleted,
            ]}
            onPress={() => onToggleComplete(reminder.id)}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: reminder.completed }}
          >
            {reminder.completed && (
              <Feather name="check" size={14} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Descripción opcional */}
      {reminder.description ? (
        <Text
          style={[
            styles.description,
            reminder.completed && styles.textCompleted,
          ]}
          numberOfLines={2}
        >
          {reminder.description}
        </Text>
      ) : null}

      <View style={styles.divider} />

      {/* Pie: Fecha, Hora y Eliminar */}
      <View style={styles.footerRow}>
        <View style={styles.dateTimeContainer}>
          <Feather name="calendar" size={13} color="#94A3B8" />
          <Text style={styles.metaText}>{reminder.date}</Text>

          <Text style={styles.dotSeparator}>•</Text>

          <Feather name="clock" size={13} color="#94A3B8" />
          <Text style={styles.metaText}>{reminder.time}</Text>
        </View>

        <TouchableOpacity
          onPress={() => onDelete(reminder.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          accessibilityLabel="Eliminar recordatorio"
        >
          <Feather name="trash-2" size={18} color="#BDC5D2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  cardCompleted: {
    opacity: 0.55,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: "#64748B",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#BDC5D2",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  description: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
  },
  textCompleted: {
    textDecorationLine: "line-through",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dotSeparator: {
    color: "#EDF0F4",
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
});
