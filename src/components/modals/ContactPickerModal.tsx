import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ReminderContact } from "../../types";
import { COLORS, RADIUS } from "../../constants/theme";

interface Props {
  visible: boolean;
  contacts: ReminderContact[];
  loading: boolean;
  onSelectContact: (contact: ReminderContact) => void;
  onClose: () => void;
}

export default function ContactPickerModal({
  visible,
  contacts,
  loading,
  onSelectContact,
  onClose,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase().trim();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query)),
    );
  }, [contacts, searchQuery]);

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  const handleSelect = (contact: ReminderContact) => {
    setSearchQuery("");
    onSelectContact(contact);
  };

  const renderItem = ({ item }: { item: ReminderContact }) => {
    const initial = item.name.charAt(0).toUpperCase() || "?";

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Seleccionar contacto ${item.name}`}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.phone ? (
            <View style={styles.contactDetailRow}>
              <Feather name="phone" size={12} color={COLORS.textSubtle} />
              <Text style={styles.contactDetailText} numberOfLines={1}>
                {item.phone}
              </Text>
            </View>
          ) : item.email ? (
            <View style={styles.contactDetailRow}>
              <Feather name="mail" size={12} color={COLORS.textSubtle} />
              <Text style={styles.contactDetailText} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          ) : null}
        </View>

        <Feather name="chevron-right" size={18} color={COLORS.iconMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
        >
          <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Feather name="users" size={20} color={COLORS.primary} />
                <Text style={styles.headerTitle}>Agenda de Contactos</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Cerrar selector de contactos"
              >
                <Feather name="x" size={20} color={COLORS.textSubtle} />
              </TouchableOpacity>
            </View>

            {/* Buscador */}
            <View style={styles.searchContainer}>
              <Feather
                name="search"
                size={16}
                color={COLORS.textPlaceholder}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o teléfono..."
                placeholderTextColor={COLORS.textPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && Platform.OS !== "ios" && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather
                    name="x-circle"
                    size={16}
                    color={COLORS.textPlaceholder}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Contenido / Lista */}
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.statusText}>Cargando contactos...</Text>
              </View>
            ) : filteredContacts.length === 0 ? (
              <View style={styles.centerContainer}>
                <Feather name="user-x" size={42} color={COLORS.iconMuted} />
                <Text style={styles.emptyTitle}>
                  {searchQuery
                    ? "Sin resultados"
                    : "No hay contactos disponibles"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? "Prueba buscando con otro término."
                    : "No se encontraron contactos en la agenda de tu dispositivo."}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item, index) =>
                  `${item.name}-${item.phone || item.email || index}`
                }
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayBackdrop,
    justifyContent: "flex-end",
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.card,
    borderTopRightRadius: RADIUS.card,
    maxHeight: "85%",
    minHeight: "55%",
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundAlt,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: RADIUS.md,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  contactDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactDetailText: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.backgroundAlt,
  },
  centerContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSubtle,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textPlaceholder,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

