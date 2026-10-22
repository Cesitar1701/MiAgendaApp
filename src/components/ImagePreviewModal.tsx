import React from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/theme";

interface Props {
  visible: boolean;
  imageUri?: string | null;
  title?: string;
  onClose: () => void;
}

export default function ImagePreviewModal({
  visible,
  imageUri,
  title,
  onClose,
}: Props) {
  if (!imageUri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.card}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title || "Foto del recordatorio"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Cerrar vista de foto"
            >
              <Feather name="x" size={22} color={COLORS.textSubtle} />
            </TouchableOpacity>
          </View>

          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "92%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: 18,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginRight: 10,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.backgroundAlt,
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  closeButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});
