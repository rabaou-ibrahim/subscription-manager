import React, { useMemo, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, Pressable,
  FlatList, TextInput, Dimensions, Image
} from "react-native";

export default function ModalSelect({
  visible,
  title = "Sélectionner",
  // Soit tu passes "items" [{label, value, icon?}], soit "options" [string]
  items,
  options,
  value,
  onChange,        // callback(label) – compat
  onChangeItem,    // callback(item) – préféré
  onClose,
  maxHeight,
  compact = true,
  columns = 2,
  searchable = true,
}) {
  const [q, setQ] = useState("");

  const normalized = useMemo(() => {
    if (Array.isArray(items) && items.length) return items;
    const arr = Array.isArray(options) ? options : [];
    return arr.map((label) => ({ label, value: label }));
  }, [items, options]);

  const filtered = useMemo(() => {
    if (!searchable || !q) return normalized;
    const s = q.toLowerCase();
    return normalized.filter(it => String(it.label).toLowerCase().includes(s));
  }, [normalized, q, searchable]);

  const { height } = Dimensions.get("window");
  const cardMaxH = maxHeight || Math.min(420, Math.floor(height * 0.6));

  const Avatar = ({ label }) => (
    <View style={{
      width: 28, height: 28, borderRadius: 6,
      backgroundColor: "#2a2a2a", alignItems: "center", justifyContent: "center"
    }}>
      <Text style={{ color: "#A6FF00", fontWeight: "700" }}>
        {String(label).trim().charAt(0).toUpperCase() || "?"}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const src = item.icon
      ? (typeof item.icon === "string" ? { uri: item.icon } : item.icon)
      : null;

    return (
      <TouchableOpacity
        onPress={() => {
          onChangeItem?.(item);
          onChange?.(item.label);
          onClose?.();
        }}
        style={{
          paddingVertical: compact ? 10 : 14,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: "#1a1a1a",
          margin: 6,
          flex: columns > 1 ? 1 : undefined,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        {src ? (
          <Image source={src} style={{ width: 28, height: 28, borderRadius: 6 }} resizeMode="contain" />
        ) : (
          <Avatar label={item.label} />
        )}
        <Text style={{ color: "#fff", flexShrink: 1 }}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: "#111", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 12 }}>
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <View style={{ height: 4, width: 36, backgroundColor: "#333", borderRadius: 2, marginBottom: 8 }} />
            <Text style={{ color: "#A6FF00", fontWeight: "700", fontSize: 16 }}>{title}</Text>
          </View>

          {searchable && (
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Rechercher…"
              placeholderTextColor="#777"
              style={{ backgroundColor: "#1c1c1c", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: "#fff", marginBottom: 8 }}
            />
          )}

          <View style={{ maxHeight: cardMaxH }}>
            <FlatList
              data={filtered}
              keyExtractor={(it, idx) => `${it.value}-${idx}`}
              renderItem={renderItem}
              numColumns={columns}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}
            />
          </View>

          <TouchableOpacity onPress={onClose} style={{ alignSelf: "center", marginTop: 6, paddingVertical: 10, paddingHorizontal: 16 }}>
            <Text style={{ color: "#aaa" }}>Annuler</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
