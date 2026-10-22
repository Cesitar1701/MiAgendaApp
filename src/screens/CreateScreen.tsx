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
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import { RootStackParamList, CategoryType, Reminder } from "../types";
import { saveReminder, updateReminder } from "../services/reminderStorage";
import { useLocalNotifications } from "../hooks/useLocalNotifications";
import { useCamera } from "../hooks/useCamera";
import {
  toISODateString,
  formatDisplayDate,
  formatDisplayTime,
  calcularSegundosRestantes,
  formatLeadTimeLabel,
  reconstructReminderDate,
} from "../utils/dateHelpers";
import CategorySelector from "../components/CategorySelector";
import NotificationModals from "../components/NotificationModals";
import CustomButton from "../components/CustomButton";
import { COLORS, RADIUS } from "../constants/theme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Create">;
  route?: RouteProp<RootStackParamList, "Create">;
};

export default function CreateScreen({ navigation, route }: Props) {
  const username = route?.params?.username;
  const editingReminder = route?.params?.reminder;
  const isEditing = Boolean(editingReminder);

  const { programarNotificacion, cancelarNotificacion } =
    useLocalNotifications();
  const { tomarFoto, elegirDeGaleria } = useCamera();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    () => editingReminder?.category ?? null,
  );
  const [title, setTitle] = useState<string>(
    () => editingReminder?.title ?? "",
  );
  const [description, setDescription] = useState<string>(
    () => editingReminder?.description ?? "",
  );
  const [imageUri, setImageUri] = useState<string | null>(
    () => editingReminder?.imageUri ?? null,
  );

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (editingReminder) {
      return reconstructReminderDate(editingReminder);
    }
    const now = new Date();
    now.setSeconds(0, 0);
    return now;
  });

  const [withNotification, setWithNotification] = useState<boolean>(() =>
    Boolean(
      editingReminder &&
        (editingReminder.notificationId ||
          (editingReminder.leadTimeSeconds !== undefined &&
            editingReminder.leadTimeSeconds !== null)),
    ),
  );
  const [leadTimeSeconds, setLeadTimeSeconds] = useState<number>(
    () => editingReminder?.leadTimeSeconds ?? -10,
  );
  const [notificationLabel, setNotificationLabel] = useState<string>(() =>
    editingReminder?.leadTimeSeconds !== undefined &&
    editingReminder?.leadTimeSeconds !== null
      ? formatLeadTimeLabel(editingReminder.leadTimeSeconds)
      : "Modo Prueba (10 seg)",
  );

  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);
  const [iosPickerMode, setIosPickerMode] = useState<"date" | "time" | null>(
    null,
  );

  const formattedDate = formatDisplayDate(selectedDate);
  const formattedTime = formatDisplayTime(selectedDate);

  const applyPickedDate = (mode: "date" | "time", newDate: Date) => {
    setSelectedDate((prevDate) => {
      const updated = new Date(prevDate);
      if (mode === "date") {
        updated.setFullYear(
          newDate.getFullYear(),
          newDate.getMonth(),
          newDate.getDate(),
        );
      } else {
        updated.setHours(newDate.getHours(), newDate.getMinutes(), 0, 0);
      }
      return updated;
    });
  };

  const handleOpenPicker = (mode: "date" | "time") => {
    if (Platform.OS === "android") {
      if (mode === "date") {
        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: "date",
          onValueChange: (_event, newDate?: Date) => {
            if (newDate) applyPickedDate("date", newDate);
          },
        });
      } else {
        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: "time",
          is24Hour: true,
          onValueChange: (_event, newDate?: Date) => {
            if (newDate) applyPickedDate("time", newDate);
          },
        });
      }
    } else {
      setIosPickerMode(mode);
    }
  };

  const handleTakePhoto = async () => {
    const uri = await tomarFoto();
    if (uri) {
      setImageUri(uri);
    }
  };

  const handlePickFromGallery = async () => {
    const uri = await elegirDeGaleria();
    if (uri) {
      setImageUri(uri);
    }
  };

  const handleToggleNotification = () => {
    if (!withNotification) {
      setShowPresetModal(true);
    } else {
      setWithNotification(false);
    }
  };

  const handleSelectLeadTime = (seconds: number, label: string) => {
    setLeadTimeSeconds(seconds);
    setNotificationLabel(label);
    setWithNotification(true);
    setShowPresetModal(false);
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
        secondsRemaining = calcularSegundosRestantes(
          selectedDate.getTime(),
          leadTimeSeconds,
        );

        if (secondsRemaining <= 0) {
          Alert.alert(
            "Hora no válida",
            "La hora programada para la notificación ya ha pasado. Por favor selecciona una fecha posterior.",
          );
          return;
        }
      }

      if (editingReminder?.notificationId) {
        await cancelarNotificacion(editingReminder.notificationId);
      }

      if (!editingReminder?.completed) {
        notifId = await programarNotificacion(
          title.trim(),
          description.trim(),
          secondsRemaining,
        );

        if (!notifId) {
          return;
        }
      }
    } else if (editingReminder?.notificationId) {
      await cancelarNotificacion(editingReminder.notificationId);
    }

    const reminderPayload: Reminder = {
      id: editingReminder ? editingReminder.id : Date.now().toString(),
      username: username ?? editingReminder?.username,
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      date: formattedDate,
      isoDate: toISODateString(selectedDate),
      time: formattedTime,
      targetTimestamp: selectedDate.getTime(),
      leadTimeSeconds: withNotification ? leadTimeSeconds : null,
      completed: editingReminder ? editingReminder.completed : false,
      notificationId: notifId,
      imageUri: imageUri ?? null,
    };

    const saved = isEditing
      ? await updateReminder(reminderPayload, username)
      : await saveReminder(reminderPayload, username);

    if (saved) {
      navigation.goBack();
    } else {
      Alert.alert(
        "Error",
        isEditing
          ? "No se pudo actualizar el recordatorio."
          : "No se pudo guardar el recordatorio.",
      );
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
              <Text style={styles.sheetTitle}>
                {isEditing ? "Editar elemento" : "Nuevo elemento"}
              </Text>
              <Text style={styles.sheetSubtitle}>Tarea</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={22} color={COLORS.textSubtle} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
          >
            <CategorySelector
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <Text style={styles.fieldLabel}>Título del recordatorio</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Entrega del proyecto"
              placeholderTextColor={COLORS.textPlaceholder}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.labelWithIcon}>
              <Feather name="align-left" size={14} color={COLORS.textBody} />
              <Text style={styles.fieldLabelInline}>Descripción o notas</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Añade detalles que puedan ayudarte..."
              placeholderTextColor={COLORS.textPlaceholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.rowTwoCols}>
              <View style={styles.col}>
                <View style={styles.labelWithIcon}>
                  <Feather name="calendar" size={13} color={COLORS.textBody} />
                  <Text style={styles.fieldLabelInline}>Fecha</Text>
                </View>
                <TouchableOpacity
                  style={[styles.input, styles.pickerTrigger]}
                  onPress={() => handleOpenPicker("date")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerTriggerText}>{formattedDate}</Text>
                  <Feather
                    name="chevron-down"
                    size={14}
                    color={COLORS.textSubtle}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.col}>
                <View style={styles.labelWithIcon}>
                  <Feather name="clock" size={13} color={COLORS.textBody} />
                  <Text style={styles.fieldLabelInline}>Hora</Text>
                </View>
                <TouchableOpacity
                  style={[styles.input, styles.pickerTrigger]}
                  onPress={() => handleOpenPicker("time")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerTriggerText}>{formattedTime}</Text>
                  <Feather
                    name="chevron-down"
                    size={14}
                    color={COLORS.textSubtle}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botones de Cámara y Galería / Vista Previa */}
            {imageUri ? (
              <View style={styles.photoAttachedBox}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.photoThumbnail}
                />
                <View style={styles.photoInfo}>
                  <Text style={styles.photoAttachedTitle}>Foto adjunta</Text>
                  <View style={styles.photoReplaceActions}>
                    <TouchableOpacity
                      onPress={handleTakePhoto}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.retakePhotoText}>Cámara</Text>
                    </TouchableOpacity>
                    <Text style={styles.photoActionsDot}>•</Text>
                    <TouchableOpacity
                      onPress={handlePickFromGallery}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.retakePhotoText}>Galería</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setImageUri(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Quitar foto adjunta"
                >
                  <Feather name="trash-2" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.rowTwoCols}>
                <TouchableOpacity
                  style={[styles.col, styles.cameraButton]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={16} color={COLORS.textMuted} />
                  <Text style={styles.cameraButtonText}>Tomar foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.col, styles.cameraButton]}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.8}
                >
                  <Feather name="image" size={16} color={COLORS.textMuted} />
                  <Text style={styles.cameraButtonText}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}

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
                color={withNotification ? COLORS.primary : COLORS.textMuted}
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

            <CustomButton
              title={isEditing ? "Guardar cambios" : "Guardar recordatorio"}
              leftIcon="check"
              onPress={handleSave}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <NotificationModals
        showPresetModal={showPresetModal}
        onClosePresetModal={() => setShowPresetModal(false)}
        onSelectLeadTime={handleSelectLeadTime}
      />

      {/* Selector de Fecha/Hora para iOS */}
      {Platform.OS !== "android" && (
        <Modal
          visible={iosPickerMode !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setIosPickerMode(null)}
        >
          <TouchableOpacity
            style={styles.dialogOverlay}
            activeOpacity={1}
            onPress={() => setIosPickerMode(null)}
          >
            <View style={styles.dialogBox}>
              {iosPickerMode && (
                <DateTimePicker
                  value={selectedDate}
                  mode={iosPickerMode}
                  display="spinner"
                  onChange={(_event, newDate) => {
                    if (newDate) applyPickedDate(iosPickerMode, newDate);
                  }}
                />
              )}
              <View style={styles.dialogActions}>
                <TouchableOpacity
                  onPress={() => setIosPickerMode(null)}
                  style={styles.dialogButtonConfirm}
                >
                  <Text style={styles.dialogButtonConfirmText}>Listo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayBackdrop,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
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
    color: COLORS.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  scrollBody: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.textPrimary,
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
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerTriggerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: COLORS.background,
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  photoAttachedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryAccentBorder,
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    gap: 12,
  },
  photoThumbnail: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundAlt,
  },
  photoInfo: {
    flex: 1,
  },
  photoAttachedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  photoReplaceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  photoActionsDot: {
    fontSize: 12,
    color: COLORS.textPlaceholder,
  },
  retakePhotoText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  notificationToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: COLORS.background,
  },
  notificationToggleActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryAccentBorder,
  },
  notificationToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  notificationToggleTextActive: {
    color: COLORS.primary,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogBox: {
    width: "80%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    elevation: 5,
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  dialogButtonConfirm: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
  },
  dialogButtonConfirmText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "600",
  },
});
