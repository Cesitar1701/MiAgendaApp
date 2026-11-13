import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";

export interface AttachmentAction {
  label: string;
  onPress: () => void;
}

interface Props {
  title: string;
  subtitle?: string;
  secondarySubtitle?: string;
  icon?: keyof typeof Feather.glyphMap;
  imageUri?: string | null;
  actions?: AttachmentAction[];
  onRemove: () => void;
  removeAccessibilityLabel: string;
}

export default function AttachmentCard({
  title,
  subtitle,
  secondarySubtitle,
  icon = "paperclip",
  imageUri,
  actions,
  onRemove,
  removeAccessibilityLabel,
}: Props) {
  return (
    <View style={styles.card}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumbnail} />
      ) : (
        <View style={styles.iconBox}>
          <Feather name={icon} size={18} color={COLORS.primary} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>

        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}

        {secondarySubtitle ? (
          <Text style={styles.secondarySubtitle} numberOfLines={1}>
            {secondarySubtitle}
          </Text>
        ) : null}

        {actions && actions.length > 0 ? (
          <View style={styles.actionsRow}>
            {actions.map((action, index) => (
              <React.Fragment key={action.label}>
                {index > 0 && <Text style={styles.dot}>•</Text>}
                <TouchableOpacity onPress={action.onPress} activeOpacity={0.7}>
                  <Text style={styles.actionText}>{action.label}</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={removeAccessibilityLabel}
      >
        <Feather name="trash-2" size={18} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  thumbnail: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundAlt,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textBody,
    marginTop: 2,
  },
  secondarySubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  dot: {
    fontSize: 12,
    color: COLORS.textPlaceholder,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
});

