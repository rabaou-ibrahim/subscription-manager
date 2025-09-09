// frontend/src/ui/AppInput.js
import React, { useState } from "react";
import { Platform, TextInput, View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BORDER = "#262626";
const FOCUS = "#72CE1D";
const ERROR = "#ff6b6b";

export default function AppInput({
  value,
  onChangeText,
  placeholder,
  icon,              // "mail-outline", "key-outline", etc.
  secure = false,
  error,
  onSubmitEditing,
  returnKeyType,
  autoCapitalize = "none",
  keyboardType,
  style,
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isSecure = secure && !show;

  return (
    <View>
      <View style={[
        {
          height: 48, borderRadius: 12, backgroundColor: "#111",
          borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12,
          flexDirection: "row", alignItems: "center",
          ...(focused ? { borderColor: FOCUS } : {}),
          ...(error ? { borderColor: ERROR, backgroundColor: "#1c0e10" } : {}),
        },
        style
      ]}>
        {icon ? <Ionicons name={icon} size={18} color="#72CE1D" style={{ marginRight: 8 }} /> : null}
        <TextInput
          style={{ flex: 1, color: "#fff", paddingVertical: 10, ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}) }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8e8e8e"
          secureTextEntry={isSecure}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
        />
        {secure ? (
          <TouchableOpacity onPress={() => setShow(s => !s)} style={{ padding: 6, marginLeft: 4 }}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color="#7f7f7f" />
          </TouchableOpacity>
        ) : null}
      </View>
      {!!error && <Text style={{ color: ERROR, fontSize: 12, marginTop: 6 }}>{error}</Text>}
    </View>
  );
}
