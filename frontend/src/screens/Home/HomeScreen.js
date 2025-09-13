// src/screens/home/HomeScreen.js
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import useAuth from "../../hooks/useAuth";
import Layout from "../../ui/Layout";

const GREEN = "#B7FF27";
const BORDER = "#242424";
const CARD = "#111";
const TEXT = "#eaeaea";
const MUTED = "#9a9a9a";

const ActionTile = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={{
      backgroundColor: "#141414",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: BORDER,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{
        width: 30, height: 30, borderRadius: 8, backgroundColor: "#1b1b1b",
        borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center",
      }}>
        <Ionicons name={icon} size={20} color={GREEN} />
      </View>
      <Text style={{ color: TEXT, fontSize: 14, fontWeight: "600" }}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#7f7f7f" />
  </TouchableOpacity>
);

export default function HomeScreen() {
  const { loading, isLogged, user, logout } = useAuth();
  const nav = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;

  const displayName = useMemo(
    () => user?.firstname || user?.full_name || user?.email || "Utilisateur",
    [user]
  );
  const initial = (displayName?.[0] || "U").toUpperCase();

  return (
    <Layout scroll header={<AppHeader />} footer={<AppFooter />} maxWidth={null}>
      {/* BG blobs plein écran (ne doivent pas intercepter les touches) */}
       <View pointerEvents="none" style={{ position:"absolute", inset:0, zIndex:0 }}>
        <View style={{ position:"absolute", top:-60, left:-40, width:320, height:320, borderRadius:160, opacity:0.12, backgroundColor: GREEN }} />
        <View style={{ position:"absolute", bottom:-80, right:-60, width:320, height:320, borderRadius:160, opacity:0.12, backgroundColor:"#7C3AED" }} />
      </View>

      {/* Contenu centré jusqu’à 1200px */}
      <View style={{ position:"relative", zIndex:1, width:"100%", maxWidth:1200, alignSelf:"center" }}>
        {/* HERO */}
        <View style={{ backgroundColor:"#121212", borderWidth:1, borderColor:BORDER, borderRadius:18, padding:18, marginBottom:18 }}>
          <Text style={{ color: MUTED, fontSize: 12, letterSpacing: 0.4, marginBottom: 6 }}>Simple • Partagé • Serein</Text>
          <Text style={{ color: TEXT, fontSize: 22, fontWeight: "800", marginBottom: 6 }}>Gérez vos abonnements en famille sans prise de tête</Text>
          <Text style={{ color: MUTED, fontSize: 14 }}>Suivez les paiements, évitez les doublons et gardez la main sur le budget.</Text>
        </View>

        {/* Greeting */}
        {isLogged && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#1e1e1e", borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: TEXT, fontWeight: "700" }}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: MUTED, fontSize: 12, marginBottom: 2 }}>Bonjour</Text>
              <Text style={{ color: TEXT, fontSize: 16, fontWeight: "700" }}>{displayName}</Text>
            </View>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: GREEN }}
              onPress={() => nav.navigate("Dashboard")}
            >
              <Ionicons name="speedometer-outline" size={16} color="#000" />
              <Text style={{ color: "#000", fontWeight: "800", fontSize: 12 }}>Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* QUICK ACTIONS */}
        <View style={{ gap: 60, marginBottom: 18, ...(isWide ? { flexDirection: "row" } : {}) }}>
          <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14 }}>
              <Text style={{ color: TEXT, fontWeight: "800", marginBottom: 8, fontSize: 14 }}>Actions rapides</Text>
              {!isLogged ? (
                <>
                  <ActionTile icon="log-in-outline" label="Se connecter" onPress={() => nav.navigate("Login")} />
                  <ActionTile icon="person-add-outline" label="Créer un compte" onPress={() => { if (!isLogged) nav.navigate("Register"); }} />
                </>
              ) : (
                <>
                  <ActionTile icon="grid-outline" label="Ouvrir le Dashboard" onPress={() => nav.navigate("Dashboard")} />
                  <ActionTile icon="albums-outline" label="Mes abonnements" onPress={() => nav.navigate("SubscriptionList")} />
                  <ActionTile icon="people-outline" label="Espaces" onPress={() => nav.navigate("SpacesScreen")} />
                  <ActionTile icon="add-circle-outline" label="Ajouter un abonnement" onPress={() => nav.navigate("AddSubscription")} />
                  <ActionTile icon="person-outline" label="Mon profil" onPress={() => nav.navigate("Profile")} />
                </>
              )}
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14 }}>
              <Text style={{ color: TEXT, fontWeight: "800", marginBottom: 8, fontSize: 14 }}>Pourquoi nous ?</Text>
              {[
                "Vue claire des dépenses mensuelles",
                "Partage dans des espaces (famille, colocs, équipe)",
                "Rappels d’échéances — fini les oublis",
                "Ajout ultra simple d’un abonnement",
              ].map((t) => (
                <View key={t} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color={GREEN} />
                  <Text style={{ color: "#9a9a9a", fontSize: 13, flexShrink: 1 }}>{t}</Text>
                </View>
              ))}
              {!isLogged ? (
                <TouchableOpacity style={{ marginTop: 10, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GREEN }} onPress={() => nav.navigate("Register")}>
                  <Text style={{ color: "#000", fontWeight: "800" }}>Créer mon compte</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={{ marginTop: 10, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#181818", borderWidth: 1, borderColor: BORDER }} onPress={() => nav.navigate("AddSubscription")}>
                  <Text style={{ color: GREEN, fontWeight: "800" }}>Ajouter un abonnement</Text>
                  <Ionicons name="add" size={18} color={GREEN} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* FOOTER CTAs */}
        {!loading && (!isLogged ? (
          <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", marginTop: 8 }}>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: BORDER, minWidth: 160, justifyContent: "center", backgroundColor: GREEN }} onPress={() => nav.navigate("Login")}>
              <Ionicons name="log-in-outline" size={18} color="#000" />
              <Text style={{ color: "#000", fontWeight: "800" }}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: BORDER, minWidth: 160, justifyContent: "center", backgroundColor: "#101010" }} onPress={() => nav.navigate("Register")}>
              <Text style={{ color: TEXT, fontWeight: "800" }}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", marginTop: 8 }}>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: BORDER, minWidth: 160, justifyContent: "center", backgroundColor: "#101010" }} onPress={() => nav.navigate("Dashboard")}>
              <Text style={{ color: TEXT, fontWeight: "800" }}>Aller au Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: BORDER, minWidth: 160, justifyContent: "center", backgroundColor: GREEN }} onPress={logout}>
              <Ionicons name="log-out-outline" size={18} color="#000" />
              <Text style={{ color: "#000", fontWeight: "800" }}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </Layout>
  );
}
