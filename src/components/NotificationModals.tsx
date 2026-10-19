import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import {
  NOTIFICATION_PRESETS,
  TimeUnit,
  calculateCustomLeadTime,
} from "../utils/dateHelpers";
import { COLORS, RADIUS } from "../constants/theme";

interface Props {
  showPresetModal: boolean;
  onClosePresetModal: () => void;
  onSelectLeadTime: (seconds: number, label: string) => void;
}

const TIME_UNITS: { id: TimeUnit; label: string }[] = [
  { id: "minutes", label: "Minutos" },
  { id: "hours", label: "Horas" },
  { id: "days", label: "Días" },
  { id: "weeks", label: "Semanas" },
];

export default function NotificationModals({
  showPresetModal,
  onClosePresetModal,
  onSelectLeadTime,
}: Props) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customValue, setCustomValue] = useState("10");
  const [customUnit, setCustomUnit] = useState<TimeUnit>("minutes");

  const handleOpenCustom = () => {
    onClosePresetModal();
    setShowCustomModal(true);
  };

  const handleConfirmCustom = () => {
    const num = parseInt(customValue, 10);
    if (isNaN(num) || num <= 0) {
      Alert.alert("Atención", "Ingresa un número válido mayor a 0.");
      return;
    }

    const { seconds, label } = calculateCustomLeadTime(num, customUnit);
    onSelectLeadTime(seconds, label);
    setShowCustomModal(false);
  };

  return (
    <>
      {/* Modal 1: Opciones Predefinidas de Antelación */}
      <Modal
        visible={showPresetModal}
        transparent
        animationType="fade"
        onRequestClose={onClosePresetModal}
      >
        <TouchableOpacity
          style={styles.dialogOverlay}
          activeOpacity={1}
          onPress={onClosePresetModal}
        >
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>Añadir notificación</Text>
            {NOTIFICATION_PRESETS.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={styles.dialogOption}
                onPress={() => onSelectLeadTime(opt.seconds, opt.label)}
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

      {/* Modal 2: Antelación Personalizada */}
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
              {TIME_UNITS.map((u) => (
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
    </>
  );
}

const styles = StyleSheet.create({
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  dialogOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundAlt,
  },
  dialogOptionText: {
    fontSize: 15,
    color: COLORS.textBody,
  },
  dialogOptionCustom: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  dialogOptionCustomText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  customInput: {
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    color: COLORS.textPrimary,
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
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.backgroundAlt,
  },
  unitChipActive: {
    backgroundColor: COLORS.primary,
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSubtle,
  },
  unitChipTextActive: {
    color: COLORS.surface,
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
    color: COLORS.textSubtle,
    fontSize: 14,
    fontWeight: "600",
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
