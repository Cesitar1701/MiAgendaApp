import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { COLORS, RADIUS } from "../../constants/theme";

interface Props {
  value: Date;
  mode: "date" | "time";
  onChange: (newDate: Date) => void;
  iosDisplay?: "inline" | "spinner";
  renderTrigger: (openPicker: () => void) => React.ReactNode;
}

export default function DateTimeField({
  value,
  mode,
  onChange,
  iosDisplay = "spinner",
  renderTrigger,
}: Props) {
  const [showIosModal, setShowIosModal] = useState(false);

  const openPicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value,
        mode,
        ...(mode === "time" ? { is24Hour: true } : {}),
        onValueChange: (_event, newDate?: Date) => {
          if (newDate) {
            onChange(newDate);
          }
        },
      });
    } else {
      setShowIosModal(true);
    }
  };

  return (
    <>
      {renderTrigger(openPicker)}

      {Platform.OS !== "android" && (
        <Modal
          visible={showIosModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowIosModal(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowIosModal(false)}
          >
            <View
              style={[
                styles.card,
                iosDisplay === "inline" && styles.cardWide,
              ]}
              onStartShouldSetResponder={() => true}
            >
              <DateTimePicker
                value={value}
                mode={mode}
                display={iosDisplay}
                onChange={(_event, newDate) => {
                  if (newDate) {
                    onChange(newDate);
                  }
                }}
              />
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowIosModal(false)}
                >
                  <Text style={styles.doneText}>Listo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "80%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    elevation: 5,
  },
  cardWide: {
    width: "90%",
    borderRadius: RADIUS.xl,
    padding: 16,
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: RADIUS.md,
  },
  doneText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});

