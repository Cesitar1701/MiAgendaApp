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
  Switch,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import { RootStackParamList, CategoryType, Reminder, ReminderLocation, ReminderContact } from "../types";
import { useReminderStore } from "../store/useReminderStore";
import {
  useLocalNotifications,
  sincronizarBadgePendientes,
} from "../hooks/useLocalNotifications";
import { useCamera } from "../hooks/useCamera";
import { useDeviceContacts } from "../hooks/useDeviceContacts";
import { useDeviceCalendar } from "../hooks/useDeviceCalendar";
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
import MapLocationPickerModal from "../components/MapLocationPickerModal";
import ContactPickerModal from "../components/ContactPickerModal";
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

  const addReminder = useReminderStore((state) => state.addReminder);
  const updateReminder = useReminderStore((state) => state.updateReminder);

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
  const [location, setLocation] = useState<ReminderLocation | null>(
    () => editingReminder?.location ?? null,
  );
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [contact, setContact] = useState<ReminderContact | null>(
    () => editingReminder?.contact ?? null,
  );
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const {
    contacts: deviceContacts,
    loading: loadingContacts,
    solicitarPermisoContactos,
    cargarContactos,
  } = useDeviceContacts();

  const {
    solicitarPermisoCalendario,
    crearEventoCalendario,
    actualizarEventoCalendario,
    eliminarEventoCalendario,
  } = useDeviceCalendar();

  const [syncWithCalendar, setSyncWithCalendar] = useState<boolean>(() =>
    Boolean(editingReminder?.calendarEventId),
  );

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

    const reminderId = editingReminder
      ? editingReminder.id
      : Date.now().toString();

    let notifId: string | null = null;
    if (withNotification) {
      const secondsRemaining = calcularSegundosRestantes(
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

      if (editingReminder?.notificationId) {
        await cancelarNotificacion(editingReminder.notificationId);
      }

      if (!editingReminder?.completed) {
        notifId = await programarNotificacion(
          title.trim(),
          description.trim(),
          secondsRemaining,
          {
            category: selectedCategory,
            reminderId,
            username: username ?? editingReminder?.username,
            targetDate: formattedDate,
            targetTime: formattedTime,
            leadTimeSeconds: withNotification ? leadTimeSeconds : null,
          },
        );

        if (!notifId) {
          return;
        }
      }
    } else if (editingReminder?.notificationId) {
      await cancelarNotificacion(editingReminder.notificationId);
    }

    // Sincronización con el calendario nativo del teléfono
    let calendarEventId: string | undefined = editingReminder?.calendarEventId;

    if (syncWithCalendar) {
      const eventPayload = {
        title: title.trim(),
        description: description.trim(),
        startDate: selectedDate,
        endDate: new Date(selectedDate.getTime() + 60 * 60 * 1000),
        location: location ?? undefined,
        leadTimeSeconds: withNotification ? leadTimeSeconds : null,
      };

      if (calendarEventId) {
        const updated = await actualizarEventoCalendario(
          calendarEventId,
          eventPayload,
        );
        if (!updated) {
          const newId = await crearEventoCalendario(eventPayload);
          calendarEventId = newId ?? calendarEventId;
        }
      } else {
        const createdId = await crearEventoCalendario(eventPayload);
        if (createdId) {
          calendarEventId = createdId;
        }
      }
    } else if (calendarEventId) {
      await eliminarEventoCalendario(calendarEventId);
      calendarEventId = undefined;
    }

    const reminderPayload: Reminder = {
      id: reminderId,
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
      location: location ?? undefined,
      contact: contact ?? undefined,
      calendarEventId: calendarEventId ?? undefined,
    };

    const saved = isEditing
      ? await updateReminder(reminderPayload, username)
      : await addReminder(reminderPayload, username);

    if (saved) {
      await sincronizarBadgePendientes(
        username ?? editingReminder?.username,
      ).catch(() => {});
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

            {/* Ubicación asignada / Botón Agregar Ubicación */}
            {location ? (
              <View style={styles.locationAttachedBox}>
                <View style={styles.locationIconBox}>
                  <Feather name="map-pin" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationAttachedTitle}>
                    Ubicación asignada
                  </Text>
                  <Text style={styles.locationAddressText} numberOfLines={2}>
                    {location.address ||
                      `Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowMapModal(true)}
                    activeOpacity={0.7}
                    style={styles.changeLocationButton}
                  >
                    <Text style={styles.changeLocationText}>
                      Cambiar en mapa
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => setLocation(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Quitar ubicación adjunta"
                >
                  <Feather name="trash-2" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => setShowMapModal(true)}
                activeOpacity={0.8}
              >
                <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                <Text style={styles.locationButtonText}>Agregar ubicación</Text>
              </TouchableOpacity>
            )}

            {/* Contacto asignado / Botón Asociar contacto */}
            {contact ? (
              <View style={styles.contactAttachedBox}>
                <View style={styles.contactIconBox}>
                  <Feather name="user" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactAttachedTitle}>
                    Contacto asociado
                  </Text>
                  <Text style={styles.contactNameText} numberOfLines={1}>
                    {contact.name}
                  </Text>
                  {contact.phone || contact.email ? (
                    <Text style={styles.contactPhoneText} numberOfLines={1}>
                      {contact.phone || contact.email}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={handleOpenContactPicker}
                    activeOpacity={0.7}
                    style={styles.changeContactButton}
                  >
                    <Text style={styles.changeContactText}>
                      Cambiar contacto
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => setContact(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Quitar contacto asociado"
                >
                  <Feather name="trash-2" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleOpenContactPicker}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Asociar contacto"
              >
                <Feather name="user-plus" size={16} color={COLORS.textMuted} />
                <Text style={styles.contactButtonText}>Agregar contacto</Text>
              </TouchableOpacity>
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

            {/* Switch de sincronización con el calendario nativo del teléfono */}
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
  locationButton: {
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
  locationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  locationAttachedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryAccentBorder,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  locationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationAttachedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  locationAddressText: {
    fontSize: 13,
    color: COLORS.textBody,
    marginTop: 2,
  },
  changeLocationButton: {
    marginTop: 4,
    alignSelf: "flex-start",
  },
  changeLocationText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  contactButton: {
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
  contactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  contactAttachedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryAccentBorder,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {
    flex: 1,
  },
  contactAttachedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  contactNameText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  contactPhoneText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 1,
  },
  changeContactButton: {
    marginTop: 4,
    alignSelf: "flex-start",
  },
  changeContactText: {
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
