import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import {
  RootStackParamList,
  CategoryType,
  ReminderLocation,
  ReminderContact,
} from "../types";
import { useReminders } from "../hooks/useReminders";
import { useCamera } from "../hooks/useCamera";
import { useDeviceContacts } from "../hooks/useDeviceContacts";
import { useDeviceCalendar } from "../hooks/useDeviceCalendar";
import {
  formatDisplayDate,
  formatDisplayTime,
  formatLeadTimeLabel,
  reconstructReminderDate,
} from "../utils/dateHelpers";
import CategorySelector from "../components/reminders/CategorySelector";
import NotificationModals from "../components/modals/NotificationModals";
import MapLocationPickerModal from "../components/modals/MapLocationPickerModal";
import ContactPickerModal from "../components/modals/ContactPickerModal";
import CustomButton from "../components/ui/CustomButton";
import CustomInput from "../components/ui/CustomInput";
import AttachmentCard from "../components/ui/AttachmentCard";
import DateTimeField from "../components/ui/DateTimeField";
import { COLORS, RADIUS } from "../constants/theme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Create">;
  route?: RouteProp<RootStackParamList, "Create">;
};

export default function CreateScreen({ navigation, route }: Props) {
  const editingReminder = route?.params?.reminder;
  const isEditing = Boolean(editingReminder);

  const { saveOrUpdateReminder } = useReminders();
  const { tomarFoto, elegirDeGaleria } = useCamera();
  const {
    contacts: deviceContacts,
    loading: loadingContacts,
    solicitarPermisoContactos,
    cargarContactos,
  } = useDeviceContacts();
  const { solicitarPermisoCalendario } = useDeviceCalendar();

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
  const [location, setLocation] = useState<ReminderLocation | null>(
    () => editingReminder?.location ?? null,
  );
  const [contact, setContact] = useState<ReminderContact | null>(
    () => editingReminder?.contact ?? null,
  );
  const [syncWithCalendar, setSyncWithCalendar] = useState<boolean>(() =>
    Boolean(editingReminder?.calendarEventId),
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
  const [leadTimeSeconds, setLeadTimeSeconds] = useState<number>(() =>
    editingReminder?.leadTimeSeconds !== undefined &&
    editingReminder?.leadTimeSeconds !== null
      ? Math.max(0, editingReminder.leadTimeSeconds)
      : 0,
  );
  const [notificationLabel, setNotificationLabel] = useState<string>(() =>
    editingReminder?.leadTimeSeconds !== undefined &&
    editingReminder?.leadTimeSeconds !== null
      ? formatLeadTimeLabel(editingReminder.leadTimeSeconds)
      : "A la hora del evento",
  );

  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);

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

  const handleToggleCalendarSync = async (value: boolean) => {
    if (value) {
      const granted = await solicitarPermisoCalendario();
      if (!granted) {
        setSyncWithCalendar(false);
        return;
      }
    }
    setSyncWithCalendar(value);
  };

  const handleOpenContactPicker = async () => {
    const hasPermission = await solicitarPermisoContactos();
    if (hasPermission) {
      setShowContactModal(true);
      await cargarContactos();
    }
  };

  const handleTakePhoto = async () => {
    const uri = await tomarFoto();
    if (uri) setImageUri(uri);
  };

  const handlePickFromGallery = async () => {
    const uri = await elegirDeGaleria();
    if (uri) setImageUri(uri);
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

    const saved = await saveOrUpdateReminder({
      title,
      description,
      category: selectedCategory,
      selectedDate,
      withNotification,
      leadTimeSeconds,
      syncWithCalendar,
      imageUri,
      location,
      contact,
      editingReminder,
    });

    if (saved) {
      navigation.goBack();
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

            <CustomInput
              label="Título del recordatorio"
              placeholder="Ej. Entrega del proyecto"
              value={title}
              onChangeText={setTitle}
              inputWrapperStyle={styles.fieldInputWrapper}
            />

            <View style={styles.labelWithIcon}>
              <Feather name="align-left" size={14} color={COLORS.textBody} />
              <Text style={styles.fieldLabelInline}>Descripción o notas</Text>
            </View>
            <CustomInput
              placeholder="Añade detalles que puedan ayudarte..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              inputWrapperStyle={[styles.fieldInputWrapper, styles.textAreaWrapper]}
              style={styles.textAreaInput}
            />

            {/* Fecha y Hora */}
            <View style={styles.rowTwoCols}>
              <View style={styles.col}>
                <View style={styles.labelWithIcon}>
                  <Feather name="calendar" size={13} color={COLORS.textBody} />
                  <Text style={styles.fieldLabelInline}>Fecha</Text>
                </View>
                <DateTimeField
                  value={selectedDate}
                  mode="date"
                  onChange={(newDate) => applyPickedDate("date", newDate)}
                  renderTrigger={(openPicker) => (
                    <TouchableOpacity
                      style={[styles.pickerInput, styles.pickerTrigger]}
                      onPress={openPicker}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerTriggerText}>
                        {formattedDate}
                      </Text>
                      <Feather
                        name="chevron-down"
                        size={14}
                        color={COLORS.textSubtle}
                      />
                    </TouchableOpacity>
                  )}
                />
              </View>

              <View style={styles.col}>
                <View style={styles.labelWithIcon}>
                  <Feather name="clock" size={13} color={COLORS.textBody} />
                  <Text style={styles.fieldLabelInline}>Hora</Text>
                </View>
                <DateTimeField
                  value={selectedDate}
                  mode="time"
                  onChange={(newDate) => applyPickedDate("time", newDate)}
                  renderTrigger={(openPicker) => (
                    <TouchableOpacity
                      style={[styles.pickerInput, styles.pickerTrigger]}
                      onPress={openPicker}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerTriggerText}>
                        {formattedTime}
                      </Text>
                      <Feather
                        name="chevron-down"
                        size={14}
                        color={COLORS.textSubtle}
                      />
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>

            {/* Foto adjunta */}
            {imageUri ? (
              <AttachmentCard
                title="Foto adjunta"
                imageUri={imageUri}
                actions={[
                  { label: "Cámara", onPress: handleTakePhoto },
                  { label: "Galería", onPress: handlePickFromGallery },
                ]}
                onRemove={() => setImageUri(null)}
                removeAccessibilityLabel="Quitar foto adjunta"
              />
            ) : (
              <View style={styles.rowTwoCols}>
                <TouchableOpacity
                  style={[styles.col, styles.actionButton]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={16} color={COLORS.textMuted} />
                  <Text style={styles.actionButtonText}>Tomar foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.col, styles.actionButton]}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.8}
                >
                  <Feather name="image" size={16} color={COLORS.textMuted} />
                  <Text style={styles.actionButtonText}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Ubicación */}
            {location ? (
              <AttachmentCard
                title="Ubicación asignada"
                icon="map-pin"
                subtitle={
                  location.address ||
                  `Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`
                }
                actions={[
                  {
                    label: "Cambiar en mapa",
                    onPress: () => setShowMapModal(true),
                  },
                ]}
                onRemove={() => setLocation(null)}
                removeAccessibilityLabel="Quitar ubicación adjunta"
              />
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowMapModal(true)}
                activeOpacity={0.8}
              >
                <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                <Text style={styles.actionButtonText}>Agregar ubicación</Text>
              </TouchableOpacity>
            )}

            {/* Contacto */}
            {contact ? (
              <AttachmentCard
                title="Contacto asociado"
                icon="user"
                subtitle={contact.name}
                secondarySubtitle={contact.phone || contact.email}
                actions={[
                  {
                    label: "Cambiar contacto",
                    onPress: handleOpenContactPicker,
                  },
                ]}
                onRemove={() => setContact(null)}
                removeAccessibilityLabel="Quitar contacto asociado"
              />
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleOpenContactPicker}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Asociar contacto"
              >
                <Feather name="user-plus" size={16} color={COLORS.textMuted} />
                <Text style={styles.actionButtonText}>Agregar contacto</Text>
              </TouchableOpacity>
            )}

            {/* Notificación */}
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

            {/* Sincronización con Calendario Nativo */}
            <View
              style={[
                styles.calendarSyncCard,
                syncWithCalendar && styles.calendarSyncCardActive,
              ]}
            >
              <View style={styles.calendarSyncInfo}>
                <View style={styles.calendarSyncHeader}>
                  <Feather
                    name="calendar"
                    size={16}
                    color={syncWithCalendar ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.calendarSyncTitle,
                      syncWithCalendar && styles.calendarSyncTitleActive,
                    ]}
                  >
                    Sincronizar en el calendario del teléfono
                  </Text>
                </View>
                <Text style={styles.calendarSyncSubtitle}>
                  {syncWithCalendar
                    ? "Se sincronizará con la app Calendario del dispositivo"
                    : "No se guardará en el calendario nativo"}
                </Text>
              </View>
              <Switch
                value={syncWithCalendar}
                onValueChange={handleToggleCalendarSync}
                trackColor={{
                  false: COLORS.border,
                  true: COLORS.primaryAccentBorder,
                }}
                thumbColor={
                  syncWithCalendar
                    ? COLORS.primary
                    : Platform.OS === "android"
                      ? "#f4f3f4"
                      : undefined
                }
                accessibilityRole="switch"
                accessibilityLabel="Sincronizar en el calendario del teléfono"
              />
            </View>

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

      <MapLocationPickerModal
        visible={showMapModal}
        initialLocation={location}
        onClose={() => setShowMapModal(false)}
        onConfirm={(loc) => setLocation(loc)}
      />

      <ContactPickerModal
        visible={showContactModal}
        contacts={deviceContacts}
        loading={loadingContacts}
        onClose={() => setShowContactModal(false)}
        onSelectContact={(c) => {
          setContact(c);
          setShowContactModal(false);
        }}
      />
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
  fieldInputWrapper: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    height: 46,
  },
  textAreaWrapper: {
    height: 80,
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  textAreaInput: {
    textAlignVertical: "top",
    height: "100%",
  },
  pickerInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 16,
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
  actionButton: {
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
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
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
  calendarSyncCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  calendarSyncCardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryAccentBorder,
  },
  calendarSyncInfo: {
    flex: 1,
    marginRight: 10,
  },
  calendarSyncHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  calendarSyncTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textBody,
    flexShrink: 1,
  },
  calendarSyncTitleActive: {
    color: COLORS.primary,
  },
  calendarSyncSubtitle: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginLeft: 24,
  },
});
