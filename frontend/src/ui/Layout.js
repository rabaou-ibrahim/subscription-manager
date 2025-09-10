// src/ui/Layout.js
import React from "react";
import { SafeAreaView, ScrollView, View, StatusBar } from "react-native";

export default function Layout({
  header = null,
  footer = null,
  scroll = true,
  maxWidth = 1200,       // null => pleine largeur
  style,
  contentStyle,
  children,
}) {
  const Scroller = scroll ? ScrollView : View;

  const row = { width: "100%", alignItems: "center" };
  const inner = { width: "100%", paddingHorizontal: 16, ...(maxWidth ? { maxWidth } : null) };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: "#000", overflow: "hidden" }, style]}>
      <StatusBar barStyle="light-content" />

      {header ? (
        <View style={row}><View style={inner}>{header}</View></View>
      ) : null}

      <View style={[row, { flex: 1 }]}>
        <Scroller
          style={{ flex: 1, width: "100%" }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            { flexGrow: 1, width: "100%", ...(maxWidth ? { maxWidth } : null), paddingVertical: 16, paddingHorizontal: 16 },
            contentStyle,
          ]}
        >
          {children}
        </Scroller>
      </View>

      {footer ? (
        <View style={row}><View style={[inner, { paddingVertical: 12 }]}>{footer}</View></View>
      ) : null}
    </SafeAreaView>
  );
}
