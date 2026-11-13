import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Reminder, ReminderLocation, ReminderContact } from "../../types";
import { CATEGORIAS } from "../../constants/categories";
import { COLORS, RADIUS } from "../../constants/theme";
import ImagePreviewModal from "./ImagePreviewModal";

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
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const categoryConfig = CATEGORIAS[reminder.category] || CATEGORIAS.personal;

  const handleOpenMap = (location: ReminderLocation, title: string) => {
    const lat = location.latitude;
    const lon = location.longitude;
    const label = encodeURIComponent(location.address || title);

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lon}`,
      android: `geo:0,0?q=${lat},${lon}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
          );
        }
      })
      .catch(() => {
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
        );
      });
  };

  const handleContactPress = (contact: ReminderContact) => {
    if (contact.phone) {
      const cleanPhone = contact.phone.replace(/[^0-9+]/g, "");
      const url = `tel:${cleanPhone}`;
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          }
        })
        .catch(() => {});
    }
  };

  return (
    <>
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
            {reminder.calendarEventId ? (
              <View
                style={styles.calendarBadge}
                accessibilityRole="text"
                accessibilityLabel="Sincronizado con el calendario nativo"
              >
                <Feather name="calendar" size={11} color={COLORS.primary} />
                <Text style={styles.calendarBadgeText}>Sincronizado</Text>
              </View>
            ) : null}

            <View
              style={[styles.badge, { backgroundColor: categoryConfig.bg }]}
            >
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

        {/* Chip de Ubicación */}
        {reminder.location ? (
          <TouchableOpacity
            style={styles.locationChip}
            onPress={(e) => {
              e?.stopPropagation?.();
              handleOpenMap(reminder.location!, reminder.title);
            }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ubicación ${reminder.location.address || "en el mapa"}`}
          >
            <Feather name="map-pin" size={12} color={COLORS.primary} />
            <Text style={styles.locationChipText} numberOfLines={1}>
              {reminder.location.address ||
                `${reminder.location.latitude.toFixed(4)}, ${reminder.location.longitude.toFixed(4)}`}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Chip de Contacto */}
        {reminder.contact ? (
          <TouchableOpacity
            style={styles.contactChip}
            onPress={(e) => {
              e?.stopPropagation?.();
              handleContactPress(reminder.contact!);
            }}
            activeOpacity={reminder.contact.phone ? 0.75 : 1}
            disabled={!reminder.contact.phone}
            accessibilityRole="button"
            accessibilityLabel={`Contacto ${reminder.contact.name}${reminder.contact.phone ? `, teléfono ${reminder.contact.phone}` : ""}`}
          >
            <Feather name="user" size={12} color={COLORS.primary} />
            <Text style={styles.contactChipText} numberOfLines={1}>
              {reminder.contact.name}
              {reminder.contact.phone ? ` • ${reminder.contact.phone}` : ""}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.divider} />

        {/* Pie: Fecha, Hora, Alarma, Botón Ver Foto y Eliminar */}
        <View style={styles.footerRow}>
          <View style={styles.dateTimeContainer}>
            <Feather name="calendar" size={13} color={COLORS.textPlaceholder} />
            <Text style={styles.metaText}>{reminder.date}</Text>

            <Text style={styles.dotSeparator}>•</Text>

            <Feather name="clock" size={13} color={COLORS.textPlaceholder} />
            <Text style={styles.metaText}>{reminder.time}</Text>

            {(reminder.notificationId ||
              (reminder.leadTimeSeconds !== undefined &&
                reminder.leadTimeSeconds !== null)) &&
            !reminder.completed ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Feather
                  name="bell"
                  size={12}
                  color={COLORS.primary}
                  accessibilityLabel="Tiene alarma programada"
                />
              </>
            ) : null}
          </View>

          <View style={styles.footerActions}>
            {reminder.imageUri ? (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => setShowPhotoModal(true)}
                activeOpacity={0.75}
                accessibilityLabel="Ver foto adjunta"
              >
                <Feather name="image" size={13} color={COLORS.primary} />
                <Text style={styles.photoButtonText}>Ver foto</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => onDelete(reminder.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              accessibilityLabel="Eliminar recordatorio"
            >
              <Feather name="trash-2" size={18} color={COLORS.iconMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <ImagePreviewModal
        visible={showPhotoModal}
        imageUri={reminder.imageUri}
        title={reminder.title}
        onClose={() => setShowPhotoModal(false)}
      />
    </>
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
  calendarBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryAccentBorder,
  },
  calendarBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
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
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
    marginTop: 8,
    gap: 6,
    maxWidth: "100%",
  },
  locationChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.primaryDark,
    flexShrink: 1,
  },
  contactChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
    marginTop: 8,
    gap: 6,
    maxWidth: "100%",
  },
  contactChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
    flexShrink: 1,
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
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
  },
  photoButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
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

