import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Reminder } from "../types";
import { CATEGORIAS } from "../constants/categories";
import { COLORS, RADIUS } from "../constants/theme";

interface Props {
  reminder: Reminder;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPress?: (reminder: Reminder) => void;
}

export default function ReminderCard({
  reminder,
  onToggleComplete,
  onDelete,
  onPress,
}: Props) {
  const categoryConfig = CATEGORIAS[reminder.category] || CATEGORIAS.personal;

  return (
    <TouchableOpacity
      style={[styles.card, reminder.completed && styles.cardCompleted]}
      onPress={() => onPress?.(reminder)}
      activeOpacity={onPress ? 0.85 : 1}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Editar recordatorio ${reminder.title}`}
    >
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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: reminder.completed }}
          >
            {reminder.completed && (
              <Feather name="check" size={14} color={COLORS.surface} />
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
          <Feather name="calendar" size={13} color={COLORS.textPlaceholder} />
          <Text style={styles.metaText}>{reminder.date}</Text>

          <Text style={styles.dotSeparator}>•</Text>

          <Feather name="clock" size={13} color={COLORS.textPlaceholder} />
          <Text style={styles.metaText}>{reminder.time}</Text>
        </View>

        <TouchableOpacity
          onPress={() => onDelete(reminder.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          accessibilityLabel="Eliminar recordatorio"
        >
          <Feather name="trash-2" size={18} color={COLORS.iconMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: COLORS.textSubtle,
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
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textSubtle,
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
    borderRadius: RADIUS.md,
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
    borderColor: COLORS.iconMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginTop: 6,
  },
  textCompleted: {
    textDecorationLine: "line-through",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.backgroundAlt,
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
    color: COLORS.textSubtle,
    fontWeight: "500",
  },
});
