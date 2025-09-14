// src/screens/invitations/MyInvitationsScreen.js
import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import RoleGuard from "../../guards/RoleGuard";
import useAuth from "../../hooks/useAuth";

import { listMyInvites, acceptInviteById, declineInviteById } from "../../services/invitations";

const GREEN = "#B7FF27";

const relLabel = (k) => {
  switch (k) {
    case "friend":  return "Ami(e)";
    case "parent":  return "Parent";
    case "child":   return "Enfant";
    case "partner": return "Partenaire";
    case "other":   return "Autre";
    case "self":    return "Propriétaire";
    default:        return k || "—";
  }
};

export default function MyInvitationsScreen() {
  const navigation = useNavigation();
  const { token, isLogged } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    if (!isLogged) return;
    setLoading(true);
    try {
      const list = await listMyInvites(authHeaders);
      setItems(list);
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Impossible de charger les invitations.");
    } finally {
      setLoading(false);
    }
  }, [isLogged, token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onAccept = async (inv) => {
    try {
      setActing(inv.id);
      await acceptInviteById(inv.id, authHeaders);
      // navigation vers l’espace
      navigation.replace("SpaceDetails", { id: inv.space_id, refreshAt: Date.now() });
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Impossible d’accepter l’invitation.");
    } finally {
      setActing(null);
    }
  };

  const onDecline = async (inv) => {
    try {
      setActing(inv.id);
      await declineInviteById(inv.id, authHeaders);
      setItems(prev => prev.filter(i => i.id !== inv.id));
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Impossible de refuser l’invitation.");
    } finally {
      setActing(null);
    }
  };

  const renderItem = ({ item }) => {
    const exp = item.expires_at ? ` · expire le ${item.expires_at}` : "";
    return (
      <View style={{ backgroundColor: "#0f0f0f", borderRadius: 12, borderWidth: 1, borderColor: "#1f1f1f", padding: 12 }}>
        <Text style={{ color: "#fff", fontWeight: "700", marginBottom: 2 }}>{item.space_name || "Espace"}</Text>
        <Text style={{ color: "#9aa0a6", marginBottom: 8 }}>
          {relLabel(item.relationship)}{exp}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => onAccept(item)}
            disabled={acting === item.id}
            style={{ flex: 1, backgroundColor: GREEN, borderRadius: 10, alignItems: "center", paddingVertical: 10 }}
          >
            {acting === item.id ? <ActivityIndicator /> : <Text style={{ color: "#000", fontWeight: "700" }}>Accepter</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDecline(item)}
            disabled={acting === item.id}
            style={{ flex: 1, backgroundColor: "#f87171", borderRadius: 10, alignItems: "center", paddingVertical: 10 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Refuser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ color: "#9aa0a6", marginTop: 8 }}>Chargement…</Text>
        </View>
      </Layout>
    );
  }

  return (
    <RoleGuard anyOf={["ROLE_USER","ROLE_ADMIN"]}>
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name="mail-unread-outline" size={18} color={GREEN} />
            <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 8 }}>Mes invitations</Text>
          </View>

          <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <Ionicons name="checkmark-done-circle-outline" size={28} color="#6b7280" />
                <Text style={{ color: "#9aa0a6", marginTop: 8 }}>Aucune invitation en attente.</Text>
              </View>
            }
          />
        </View>
      </Layout>
    </RoleGuard>
  );
}
