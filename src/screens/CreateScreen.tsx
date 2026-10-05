import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { RootStackParamList, CategoryType, Reminder } from "../types";
import { CATEGORIAS } from "../constants/categories";
import { saveReminder } from "../services/reminderStorage";
import { useLocalNotifications } from "../hooks/useLocalNotifications";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Create">;
};

type TimeUnit = "minutes" | "hours" | "days" | "weeks";

const PRESET_OPTIONS = [
  { label: "A los 10 segundos", seconds: -10 },
  { label: "5 minutos antes", seconds: 5 * 60 },
  { label: "15 minutos antes", seconds: 15 * 60 },
  { label: "30 minutos antes", seconds: 30 * 60 },
  { label: "1 hora antes", seconds: 60 * 60 },
  { label: "1 día antes", seconds: 1440 * 60 },
];

export default function CreateScreen({ navigation }: Props) {
  const { programarNotificacion } = useLocalNotifications();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null,
  );
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now;
  });

  // Estados para notificación y modales estilo Google Calendar
  const [withNotification, setWithNotification] = useState<boolean>(false);
  const [leadTimeSeconds, setLeadTimeSeconds] = useState<number>(-10);
  const [notificationLabel, setNotificationLabel] = useState<string>(
    "Modo Prueba (10 seg)",
  );

  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  const [customValue, setCustomValue] = useState<string>("10");
  const [customUnit, setCustomUnit] = useState<TimeUnit>("minutes");

  const formattedDate = selectedDate.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = selectedDate.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const handleOpenPicker = (mode: "date" | "time") => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: mode,
        is24Hour: true,
        onValueChange: (_eventOrDate: any, maybeDate?: Date) => {
          const newDate =
            maybeDate instanceof Date
              ? maybeDate
              : _eventOrDate instanceof Date
                ? _eventOrDate
                : null;
          if (newDate) {
            setSelectedDate((prevDate) => {
              const updated = new Date(prevDate);
              if (mode === "date") {
                updated.setFullYear(
                  newDate.getFullYear(),
                  newDate.getMonth(),
                  newDate.getDate(),
                );
              } else {
                updated.setHours(
                  newDate.getHours(),
                  newDate.getMinutes(),
                  0,
                  0,
                );
              }
              return updated;
            });
          }
        },
      } as any);
    }
  };

  // Manejo del toggle principal de notificación
  const handleToggleNotification = () => {
    if (!withNotification) {
      setShowPresetModal(true);
    } else {
      setWithNotification(false);
    }
  };

  const handleSelectPreset = (seconds: number, label: string) => {
    setLeadTimeSeconds(seconds);
    setNotificationLabel(label);
    setWithNotification(true);
    setShowPresetModal(false);
  };

  const handleOpenCustom = () => {
    setShowPresetModal(false);
    setShowCustomModal(true);
  };

  const handleConfirmCustom = () => {
    const num = parseInt(customValue, 10);
    if (isNaN(num) || num <= 0) {
      Alert.alert("Atención", "Ingresa un número válido mayor a 0.");
      return;
    }

    let calculatedSeconds = num * 60;
    let unitLabel = "minutos";

    if (customUnit === "hours") {
      calculatedSeconds = num * 3600;
      unitLabel = num === 1 ? "hora" : "horas";
    } else if (customUnit === "days") {
      calculatedSeconds = num * 86400;
      unitLabel = num === 1 ? "día" : "días";
    } else if (customUnit === "weeks") {
      calculatedSeconds = num * 604800;
      unitLabel = num === 1 ? "semana" : "semanas";
    }

    setLeadTimeSeconds(calculatedSeconds);
    setNotificationLabel(`${num} ${unitLabel} antes`);
    setWithNotification(true);
    setShowCustomModal(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(
        "Atención",
        "Por favor ingresa un título para el recordatorio.",
      );
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Atención", "Por favor selecciona una categoría.");
      return;
    }

    let notifId: string | null = null;
    if (withNotification) {
      let secondsRemaining = 0;

      if (leadTimeSeconds === -10) {
        secondsRemaining = 10;
      } else {
        const eventTime = selectedDate.getTime();
        const fireTime = eventTime - leadTimeSeconds * 1000;
        secondsRemaining = Math.floor((fireTime - Date.now()) / 1000);

        if (secondsRemaining <= 0) {
          Alert.alert(
            "Hora no válida",
            "La hora programada para la notificación ya ha pasado. Por favor selecciona una fecha posterior.",
          );
          return;
        }
      }
      notifId = await programarNotificacion(
        title.trim(),
        description.trim(),
        secondsRemaining,
      );
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      date: formattedDate,
      time: formattedTime,
      completed: false,
      notificationId: notifId,
    };

    const saved = await saveReminder(newReminder);

    if (saved) {
      navigation.goBack();
    } else {
      Alert.alert("Error", "No se pudo guardar el recordatorio.");
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.sheetTitle}>Nuevo elemento</Text>
              <Text style={styles.sheetSubtitle}>Tarea</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled={true}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Elige una categoría</Text>
              <Text style={styles.sectionSubtitle}>
                Te ayudará a encontrarlo rápidamente.
              </Text>
            </View>

            <View style={styles.categoriesRow}>
              {(Object.keys(CATEGORIAS) as CategoryType[]).map((catKey) => {
                const config = CATEGORIAS[catKey];
                const isSelected = selectedCategory === catKey;

                return (
                  <TouchableOpacity
                    key={catKey}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: config.bg },
                      isSelected && [
                        styles.categoryCardSelected,
                        { borderColor: config.text },
                      ],
                    ]}
                    onPress={() => setSelectedCategory(catKey)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.iconCircle}>
                      <Ionicons
                        name={config.icon}
                        size={18}
                        color={config.text}
                      />
                    </View>
                    <Text
                      style={[styles.categoryCardText, { color: config.text }]}
                    >
                      {config.label}
                    </Text>
                    {isSelected && (
                      <Feather
                        name="check"
                        size={14}
                        color={config.text}
                        style={styles.categoryCheck}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Título del recordatorio</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Entrega del proyecto"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.labelWithIcon}>
              <Feather name="align-left" size={14} color="#334155" />
              <Text style={styles.fieldLabelInline}>Descripción o notas</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Añade detalles que puedan ayudarte..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.rowTwoCols}>
              <View style={styles.col}>
                <View style={styles.labelWithIcon}>
                  <Feather name="calendar" size={13} color="#334155" />
                  <Text style={styles.fieldLabelInline}>Fecha</Text>
                </View>
                <TouchableOpacity
                  style={[styles.input, styles.pickerTrigger]}
                  onPress={() => handleOpenPicker("date")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerTriggerText}>{formattedDate}</Text>
                  <Feather name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.col}>
                <View style={styles.labelWithIcon}>
                  <Feather name="clock" size={13} color="#334155" />
                  <Text style={styles.fieldLabelInline}>Hora</Text>
                </View>
                <TouchableOpacity
                  style={[styles.input, styles.pickerTrigger]}
                  onPress={() => handleOpenPicker("time")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerTriggerText}>{formattedTime}</Text>
                  <Feather name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Toggle de Notificación con Modal Integrado */}
            <TouchableOpacity
              style={[
                styles.notificationToggle,
                withNotification && styles.notificationToggleActive,
              ]}
              onPress={handleToggleNotification}
              activeOpacity={0.8}
            >
              <Feather
                name="bell"
                size={16}
                color={withNotification ? "#2563EB" : "#475569"}
              />
              <Text
                style={[
                  styles.notificationToggleText,
                  withNotification && styles.notificationToggleTextActive,
                ]}
              >
                {withNotification
                  ? `Notificación: ${notificationLabel}`
                  : "Agregar notificación"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Feather
                name="check"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.saveButtonText}>Guardar recordatorio</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Modal 1: Opciones de Antelación */}
      <Modal
        visible={showPresetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPresetModal(false)}
      >
        <TouchableOpacity
          style={styles.dialogOverlay}
          activeOpacity={1}
          onPress={() => setShowPresetModal(false)}
        >
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>Añadir notificación</Text>
            {PRESET_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={styles.dialogOption}
                onPress={() => handleSelectPreset(opt.seconds, opt.label)}
              >
                <Text style={styles.dialogOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.dialogOption, styles.dialogOptionCustom]}
              onPress={handleOpenCustom}
            >
              <Text style={styles.dialogOptionCustomText}>
                Personalizado...
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal 2: Personalizado (Estilo Google Calendar) */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <TouchableOpacity
          style={styles.dialogOverlay}
          activeOpacity={1}
          onPress={() => setShowCustomModal(false)}
        >
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>Notificación personalizada</Text>

            <TextInput
              style={styles.customInput}
              keyboardType="number-pad"
              value={customValue}
              onChangeText={setCustomValue}
              maxLength={3}
            />

            <View style={styles.unitSelectorRow}>
              {(
                [
                  { id: "minutes", label: "Minutos" },
                  { id: "hours", label: "Horas" },
                  { id: "days", label: "Días" },
                  { id: "weeks", label: "Semanas" },
                ] as const
              ).map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.unitChip,
                    customUnit === u.id && styles.unitChipActive,
                  ]}
                  onPress={() => setCustomUnit(u.id)}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      customUnit === u.id && styles.unitChipTextActive,
                    ]}
                  >
                    {u.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dialogActions}>
              <TouchableOpacity
                onPress={() => setShowCustomModal(false)}
                style={styles.dialogButtonCancel}
              >
                <Text style={styles.dialogButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmCustom}
                style={styles.dialogButtonConfirm}
              >
                <Text style={styles.dialogButtonConfirmText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerTriggerText: {
    fontSize: 14,
    color: "#1E293B",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    width: "92%",
    maxHeight: "85%",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "100%",
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  scrollBody: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  categoriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  categoryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 16,
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryCardSelected: {
    borderWidth: 2,
  },
  iconCircle: {
    backgroundColor: "#FFFFFF",
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryCardText: {
    fontSize: 12,
    fontWeight: "700",
  },
  categoryCheck: {
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  fieldLabelInline: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
  notificationToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
  },
  notificationToggleActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
  },
  notificationToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  notificationToggleTextActive: {
    color: "#2563EB",
  },
  saveButton: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Diálogos modales
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogBox: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  dialogOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dialogOptionText: {
    fontSize: 15,
    color: "#334155",
  },
  dialogOptionCustom: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  dialogOptionCustomText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },
  // Inputs modal personalizado
  customInput: {
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 16,
  },
  unitSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  unitChipActive: {
    backgroundColor: "#2563EB",
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  unitChipTextActive: {
    color: "#FFFFFF",
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  dialogButtonCancel: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dialogButtonCancelText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  dialogButtonConfirm: {
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dialogButtonConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
