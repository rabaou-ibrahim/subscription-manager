// frontend/src/guards/RoleGuard.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import useAuth from "../hooks/useAuth";

export default function RoleGuard({ roles = [], children }) {
  const nav = useNavigation();
  const { loading, isAuthenticated, hasAnyRole } = useAuth();

  if (loading) return null; // splash/loader géré ailleurs si tu veux

  if (!isAuthenticated) {
    return (
      <Blocked
        title="Accès restreint"
        subtitle="Connecte-toi pour accéder à cette page."
        action={() => nav.navigate("Login")}
        actionLabel="Se connecter"
      />
    );
  }
  if (roles.length && !hasAnyRole(roles)) {
    return (
      <Blocked
        title="Permissions insuffisantes"
        subtitle="Tu n’as pas les droits requis pour cette section."
        action={() => nav.navigate("Home")}
        actionLabel="Revenir à l’accueil"
      />
    );
  }
  return <>{children}</>;
}

function Blocked({ title, subtitle, action, actionLabel }) {
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 8 }}>{title}</Text>
      <Text style={{ color: "#9aa0a6", textAlign: "center", marginBottom: 14 }}>{subtitle}</Text>
      <TouchableOpacity onPress={action} style={{
        backgroundColor: "#B7FF27",
        borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16
      }}>
        <Text style={{ color: "#000", fontWeight: "800" }}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
