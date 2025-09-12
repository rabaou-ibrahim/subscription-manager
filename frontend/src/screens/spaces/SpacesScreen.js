// src/screens/spaces/SpacesScreen.js
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";

import styles from "../../styles/SpacesStyles";
import useAuth from "../../hooks/useAuth";
import { json } from "../../services/http";

import RoleGuard from "../../guards/RoleGuard";

export default function SpacesScreen() {
  const navigation = useNavigation();
  const { token, isLogged } = useAuth();

  const [spaces, setSpaces] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const load = useCallback(async () => {
    if (!isLogged) return;
    setPending(true);
    setError(null);
    try {
      const data = await json("/api/space/all", { headers: { ...authHeaders } });
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      setSpaces(list);
    } catch (e) {
      setError(e?.message || "Impossible de charger les espaces.");
    } finally {
      setPending(false);
    }
  }, [isLogged, token]);

  useEffect(() => { if (isLogged) load(); }, [isLogged, load]);
  useFocusEffect(useCallback(() => { if (isLogged) load(); }, [isLogged, load]));

  // États non connectés / chargement
  if (!isLogged) {
    return (
      <Layout scroll={false} header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <View style={styles.center}>
          <Text style={styles.muted}>Connecte-toi pour voir tes espaces.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.ctaText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </Layout>
    );
  }

  return (
    <RoleGuard anyOf={["ROLE_USER","ROLE_ADMIN"]}>
    <Layout scroll={false} header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={styles.inactiveTab}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] })}
          >
            <Text style={styles.inactiveTabText}>Vous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.activeTab} disabled>
            <Text style={styles.activeTabText}>Espaces</Text>
          </TouchableOpacity>
        </View>

        {/* Header & CTA */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Vos espaces</Text>
          <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate("SpaceCreate")}>
            <Ionicons name="add" size={18} />
            <Text style={styles.newBtnText}>Créer</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Liste des espaces */}
        <FlatList
          data={spaces}
          keyExtractor={(it) => String(it.id)}
          refreshControl={<RefreshControl refreshing={pending} onRefresh={load} />}
          ListEmptyComponent={
            !pending && (
              <View style={styles.emptyBox}>
                <Text style={styles.muted}>Aucun espace pour le moment.</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("SpaceDetails", { id: item.id })}
            >
              <View style={styles.logoCircle}>
                <Text style={styles.logoLetter}>
                  {(item.name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name || "Espace"}</Text>
                <Text style={styles.cardSub}>
                  {item.members_count != null
                    ? `${item.members_count} membre(s)`
                    : item.description || "—"}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </Layout>
    </RoleGuard>
  );
}
