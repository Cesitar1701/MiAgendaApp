import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";

export default function AuthBrandHeader() {
  return (
    <View style={styles.brandHeader}>
      <Text style={styles.brandTitle}>MiAgenda</Text>

      <View style={styles.iconWrapper}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar-outline" size={28} color={COLORS.surface} />
        </View>
        <View style={styles.badgeContainer}>
          <Feather name="bell" size={11} color={COLORS.primary} />
        </View>
      </View>

      <Text style={styles.brandSubtitle}>TU DÍA, BAJO CONTROL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandHeader: {
    alignItems: "center",
    marginBottom: 26,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  iconWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    backgroundColor: COLORS.surface,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 2,
  },
});
