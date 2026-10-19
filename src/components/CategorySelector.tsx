import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { CategoryType } from "../types";
import { CATEGORIAS } from "../constants/categories";
import { COLORS, RADIUS } from "../constants/theme";

interface Props {
  selectedCategory: CategoryType | null;
  onSelectCategory: (category: CategoryType) => void;
}

export default function CategorySelector({
  selectedCategory,
  onSelectCategory,
}: Props) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Elige una categoría</Text>
        <Text style={styles.sectionSubtitle}>
          Te ayudará a encontrarlo rápidamente.
        </Text>
      </View>

      <View style={styles.categoriesRow}>
        {(Object.keys(CATEGORIAS) as CategoryType[]).map((catKey) => {
          const config = CATEGORIAS[catKey];
          const isSelected = selectedCategory === catKey;

          return (
            <TouchableOpacity
              key={catKey}
              style={[
                styles.categoryCard,
                { backgroundColor: config.bg },
                isSelected && [
                  styles.categoryCardSelected,
                  { borderColor: config.text },
                ],
              ]}
              onPress={() => onSelectCategory(catKey)}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={config.icon} size={18} color={config.text} />
              </View>
              <Text style={[styles.categoryCardText, { color: config.text }]}>
                {config.label}
              </Text>
              {isSelected && (
                <Feather
                  name="check"
                  size={14}
                  color={config.text}
                  style={styles.categoryCheck}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textPlaceholder,
    marginTop: 2,
  },
  categoriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  categoryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: RADIUS.lg,
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryCardSelected: {
    borderWidth: 2,
  },
  iconCircle: {
    backgroundColor: COLORS.surface,
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryCardText: {
    fontSize: 12,
    fontWeight: "700",
  },
  categoryCheck: {
    marginTop: 4,
  },
});
