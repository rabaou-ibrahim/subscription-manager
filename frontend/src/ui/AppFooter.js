// frontend/src/ui/AppFooter.js
import React from "react";
import { View, Text } from "react-native";

export default function AppFooter() {
  return (
    <View style={{
      backgroundColor: "#0b0b0b",
      borderTopWidth: 1,
      borderTopColor: "#242424",
      paddingHorizontal: 16,
      paddingVertical: 12,
      alignItems: "center",
    }}>
      <Text style={{ color: "#9aa0a6", fontSize: 12 }}>
        © {new Date().getFullYear()} Subscription Manager — Tous droits réservés
      </Text>
    </View>
  );
}
