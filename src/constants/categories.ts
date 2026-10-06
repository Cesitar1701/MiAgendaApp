import { Ionicons } from "@expo/vector-icons";
import { CategoryType } from "../types";

export interface CategoryConfig {
  label: string;
  bg: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const CATEGORIAS: Record<CategoryType, CategoryConfig> = {
  trabajo: {
    label: "Trabajo",
    bg: "#E0E7FF",
    text: "#4338CA",
    icon: "briefcase-outline",
  },
  salud: {
    label: "Salud",
    bg: "#DCFCE7",
    text: "#15803D",
    icon: "heart-outline",
  },
  personal: {
    label: "Personal",
    bg: "#FFEDD5",
    text: "#C2410C",
    icon: "home-outline",
  },
  urgente: {
    label: "Urgente",
    bg: "#FEE2E2",
    text: "#B91C1C",
    icon: "warning-outline",
  },
};
