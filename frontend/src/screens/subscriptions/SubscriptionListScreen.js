import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  SafeAreaView, ActivityIndicator, Alert, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";

import useAuth from "../../hooks/useAuth";
import { json } from "../../services/http";
import styles from "../../styles/SubscriptionListStyles";
import RoleGuard from "../../guards/RoleGuard";

export default function SubscriptionListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, isLogged, roles } = useAuth();
  const isAdmin = Array.isArray(roles) && roles.includes("ROLE_ADMIN");

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const spaceId = route.params?.spaceId ?? null;

  const [searchText, setSearchText]       = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const money = (amount, currency = "EUR") =>
    amount == null
      ? "—"
      : new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(Number(amount));

  const confirm = async (title, message) => {
    if (Platform.OS === "web") return window.confirm(`${title}\n\n${message}`);
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: "Annuler",   style: "cancel",     onPress: () => resolve(false) },
        { text: "Supprimer", style: "destructive",onPress: () => resolve(true)  },
      ]);
    });
  };

  const fetchMembersForSpace = useCallback(
    async (sid) => {
      const data = await json("/api/member/all", { headers: authHeaders });
      const arr  = Array.isArray(data) ? data : (data?.items ?? []);
      return arr.filter(m => String(m?.space?.id ?? m?.space_id) === String(sid));
    },
    [authHeaders]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = spaceId ? "/api/subscription/all" : (isAdmin ? "/api/subscription/all" : "/api/subscription/mine");
      let subsRaw = await json(endpoint, { headers: authHeaders });
      let subs    = Array.isArray(subsRaw) ? subsRaw : (subsRaw?.items ?? []);

      if (spaceId) {
        const membersInSpace = await fetchMembersForSpace(spaceId);
        const ids = new Set(membersInSpace.map(m => String(m.id)));
        subs = subs.filter(s => ids.has(String(s.member_id)));
      }
      setSubscriptions(subs);
    } catch (e) {
      setError("Impossible de charger les abonnements");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, spaceId, isAdmin, fetchMembersForSpace]);

  useFocusEffect(
    useCallback(() => {
      if (!isLogged) {
        navigation.navigate("Login");
        return;
      }
      fetchData();
    }, [isLogged, fetchData, navigation])
  );

  const onDelete = useCallback(async (item) => {
    const ok = await confirm("Supprimer", `Supprimer “${item.name || "abonnement"}” ?`);
    if (!ok) return;
    const prev = subscriptions;
    setSubscriptions(arr => arr.filter(s => s.id !== item.id)); // optimiste
    try {
      await json(`/api/subscription/delete/${item.id}`, { method: "DELETE", headers: authHeaders });
    } catch (e) {
      setSubscriptions(prev); // rollback
      Alert.alert("Erreur", e?.message || "Suppression impossible");
    }
  }, [subscriptions, authHeaders]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter(s => s.name?.toLowerCase().includes(q));
  }, [subscriptions, searchText]);

  const renderItem = ({ item }) => (
    <View style={[styles.row, { flexDirection: "row", alignItems: "center", width: "100%" }]}>
      <TouchableOpacity
        onPress={() => navigation.navigate("SubscriptionDetails", { id: item.id, subscription: item })}
        style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, flexDirection: "row", alignItems: "center" }}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <View style={styles.leftIcon}>
          <Ionicons name="card" size={24} color="#72CE1D" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>{item.name || "Sans nom"}</Text>
          <Text style={styles.subtitle}>
            {money(item.amount, item.currency)}{item.billing_frequency ? ` · ${item.billing_frequency}` : ""}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onDelete(item)} style={{ paddingHorizontal: 8, paddingVertical: 6, marginRight: 2 }}>
        <Ionicons name="trash-outline" size={20} color="#C62828" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("SubscriptionDetails", { id: item.id, subscription: item })}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <Ionicons name="chevron-forward" size={20} color="#9aa0a6" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color="#72CE1D" />
          <Text style={{ color: "#72CE1D", marginTop: 8 }}>Chargement…</Text>
        </SafeAreaView>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <SafeAreaView style={styles.container}>
          <Text style={{ color: "red" }}>{error}</Text>
        </SafeAreaView>
      </Layout>
    );
  }

  return (
    <RoleGuard anyOf={["ROLE_USER","ROLE_ADMIN"]}>
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            {/* Recherche */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher..."
                placeholderTextColor="#72CE1D"
                value={searchText}
                onChangeText={setSearchText}
              />
              <TouchableOpacity style={styles.searchButton}>
                <Ionicons name="search" size={24} color="#72CE1D" />
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <View style={{ marginBottom: 10, width: "100%" }}>
              <TouchableOpacity
                onPress={() => navigation.navigate("AddSubscription", spaceId ? { spaceId } : undefined)}
                style={{ backgroundColor: "#A6FF00", paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
              >
                <Text style={{ fontWeight: "800" }}>Ajouter un abonnement</Text>
              </TouchableOpacity>
            </View>

            {/* Liste */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              style={{ width: "100%" }}
              contentContainerStyle={[styles.contentContainer, styles.listContentContainer]}
              ListEmptyComponent={<Text style={{ color: "#aaa" }}>Aucun abonnement trouvé.</Text>}
            />
          </View>
        </SafeAreaView>
      </Layout>
    </RoleGuard>
  );
}
