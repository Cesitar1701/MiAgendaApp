import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/theme";

interface Props extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "danger";
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
}

export default function CustomButton({
  title,
  variant = "primary",
  leftIcon,
  rightIcon,
  style,
  ...props
}: Props) {
  const getBackgroundColor = () => {
    switch (variant) {
      case "primary":
        return COLORS.primary;
      case "secondary":
        return COLORS.textSubtle;
      case "danger":
        return COLORS.danger;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
      activeOpacity={0.85}
      {...props}
    >
      {leftIcon && (
        <Feather
          name={leftIcon}
          size={18}
          color={COLORS.surface}
          style={styles.iconLeft}
        />
      )}
      <Text style={styles.text}>{title}</Text>
      {rightIcon && (
        <Feather
          name={rightIcon}
          size={18}
          color={COLORS.surface}
          style={styles.iconRight}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 52,
    borderRadius: RADIUS.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  text: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 6,
  },
});