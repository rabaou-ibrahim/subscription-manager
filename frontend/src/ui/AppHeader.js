// src/ui/AppHeader.js
import React from "react";
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // 👈

const GREEN = "#B7FF27";
const BORDER = "#242424";

export default function AppHeader({ isLogged }) {
  const navigation = useNavigation();               // 👈 on récupère la nav ici
  const { width } = useWindowDimensions();
  const isSmall = width < 480;

  return (
    <View style={{ width: "100%", borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: "#0b0b0b" }}>
      <View
        style={{
          width: "100%",
          maxWidth: 1280,
          paddingHorizontal: 16,
          paddingVertical: 10,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Brand */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              backgroundColor: GREEN,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="albums-outline" size={16} color="#000" />
          </View>
          <Text style={{ color: "#fff", fontWeight: "800" }}>Subscription Manager</Text>
        </View>

        {/* Nav */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <HeaderBtn label="Accueil" icon="home-outline" onPress={() => navigation.navigate("Home")} compact={isSmall} />
          {!isLogged ? (
            <>
              <HeaderBtn label="Connexion" icon="log-in-outline" onPress={() => navigation.navigate("Login")} compact={isSmall} />
              <HeaderBtn label="Inscription" icon="person-add-outline" onPress={() => navigation.navigate("Register")} compact={isSmall} primary />
            </>
          ) : (
            <>
              <HeaderBtn label="Dashboard" icon="speedometer-outline" onPress={() => navigation.navigate("Dashboard")} compact={isSmall} />
              <HeaderBtn label="Abonnements" icon="albums-outline" onPress={() => navigation.navigate("SubscriptionList")} compact={isSmall} />
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function HeaderBtn({ label, icon, onPress, primary, compact }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        paddingVertical: compact ? 6 : 8,
        paddingHorizontal: compact ? 10 : 14,
        backgroundColor: primary ? "#B7FF27" : "#141414",
        borderWidth: 1,
        borderColor: primary ? "#B7FF27" : "#242424",
      }}
      activeOpacity={0.9}
    >
      <Ionicons name={icon} size={16} color={primary ? "#000" : "#9a9a9a"} />
      <Text style={{ color: primary ? "#000" : "#eaeaea", fontWeight: "700", fontSize: compact ? 12 : 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}
