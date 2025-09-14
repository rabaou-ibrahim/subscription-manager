// src/ui/ServicePickerModal.js (remplace le composant export default)
import React, { useMemo } from "react";
import {
  Modal, View, Text, TouchableOpacity, FlatList, Image, StyleSheet, Platform, StyleSheet as RNStyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ServicePickerModal({
  visible,
  title = "Choisir",
  items = [],
  selectedValue,
  onPick,
  options,
  value,
  onChange,
  onClose,
}) {
  const list = useMemo(() => {
    if (Array.isArray(items) && items.length) {
      return items.map((it) => (typeof it === "string" ? { label: it, value: it } : it));
    }
    if (Array.isArray(options) && options.length) {
      return options.map((label) => ({ label, value: label }));
    }
    return [];
  }, [items, options]);

  const currentValue = selectedValue ?? value;
  const handlePick = (it) => {
    onPick?.(it);
    onChange?.(it.label ?? it.value);
  };

  const Body = (
    <View style={styles.backdrop}>
      {/* 🔽 Le calque “fond” est DESSOUS la fiche → il n'intercepte plus les taps sur la liste */}
      <TouchableOpacity style={RNStyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="#9aa0a6" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={list}
          keyExtractor={(it, idx) => String(it.value ?? idx)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 6 }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={{ padding: 16 }}>
              <Text style={{ color: "#9aa0a6", textAlign: "center" }}>Aucun élément à afficher.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const active = currentValue === item.value;
            return (
              <TouchableOpacity onPress={() => handlePick(item)} style={[styles.row, active && styles.rowActive]}>
                {item.icon ? (
                  <Image source={{ uri: item.icon }} style={styles.icon} />
                ) : (
                  <View style={styles.iconPlaceholder} />
                )}
                <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
                {active ? <Ionicons name="checkmark" size={18} color="#B7FF27" /> : null}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );

  if (Platform.OS === "web") return visible ? <View style={styles.portal}>{Body}</View> : null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent presentationStyle="overFullScreen">
      {Body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  portal: { position: "fixed", inset: 0, zIndex: 9999 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 16 },
  sheet: { width: "100%", maxWidth: 520, maxHeight: 520, backgroundColor: "#0f0f0f", borderWidth: 1, borderColor: "#1f1f1f", borderRadius: 14, overflow: "hidden" },
  header: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: "#1f1f1f", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: "#fff", fontWeight: "800" },
  sep: { height: 1, backgroundColor: "#1f1f1f" },
  row: { paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  rowActive: { backgroundColor: "#121212" },
  icon: { width: 22, height: 22, borderRadius: 4 },
  iconPlaceholder: { width: 22, height: 22, borderRadius: 4, backgroundColor: "#1f1f1f" },
  label: { color: "#eee", flex: 1, minWidth: 0 },
});
