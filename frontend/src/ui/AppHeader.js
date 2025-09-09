// frontend/src/ui/AppHeader.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import useAuth from "../hooks/useAuth";

const GREEN = "#B7FF27";
const BORDER = "#242424";

export default function AppHeader({ title = "Subscription Manager" }) {
  const nav = useNavigation();
  const { isAuthenticated, user, isAdmin, logout } = useAuth();

  return (
    <View style={{
      backgroundColor: "#0b0b0b",
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      {/* Brand */}
      <TouchableOpacity onPress={() => nav.navigate("Home")} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{
          width: 26, height: 26, borderRadius: 8,
          backgroundColor: GREEN, alignItems: "center", justifyContent: "center"
        }}>
          <Ionicons name="card-outline" size={16} color="#000" />
        </View>
        <Text style={{ color: "#fff", fontWeight: "800" }}>{title}</Text>
      </TouchableOpacity>

      {/* Actions */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <HeaderBtn icon="home-outline" label="Accueil" onPress={() => nav.navigate("Home")} />
        {isAuthenticated && (
          <>
            <HeaderBtn icon="speedometer-outline" label="Dashboard" onPress={() => nav.navigate("Dashboard")} />
            <HeaderBtn icon="albums-outline" label="Abonnements" onPress={() => nav.navigate("SubscriptionList")} />
            <HeaderBtn icon="people-outline" label="Espaces" onPress={() => nav.navigate("SpacesScreen")} />
            {isAdmin ? (
              <HeaderBtn icon="shield-checkmark-outline" label="Admin" onPress={() => nav.navigate("Admin")} />
            ) : null}
            <TouchableOpacity
              onPress={logout}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: GREEN }}
            >
              <Ionicons name="log-out-outline" size={16} color="#000" />
              <Text style={{ color: "#000", fontWeight: "800" }}>Déconnexion</Text>
            </TouchableOpacity>
          </>
        )}
        {!isAuthenticated && (
          <>
            <HeaderBtn icon="log-in-outline" label="Connexion" onPress={() => nav.navigate("Login")} />
            <HeaderBtn icon="person-add-outline" label="Inscription" onPress={() => nav.navigate("Register")} />
          </>
        )}
      </View>
    </View>
  );
}

function HeaderBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: "#141414",
      borderWidth: 1,
      borderColor: "#242424",
    }}>
      <Ionicons name={icon} size={16} color="#B7FF27" />
      <Text style={{ color: "#eaeaea", fontWeight: "700", fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}
