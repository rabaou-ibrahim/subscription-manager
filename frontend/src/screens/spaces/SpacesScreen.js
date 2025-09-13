// src/screens/spaces/SpacesScreen.js
import React, { useCallback, useMemo, useRef, useState } from "react";
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

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  // Barrière anti-doublons + abort propre
  const inflightRef = useRef(false);

  const load = useCallback(async (signal) => {
    if (!isLogged || inflightRef.current) return;
    inflightRef.current = true;
    setPending(true);
    setError(null);
    try {
      const data = await json("/api/space/all", {
        headers: { ...authHeaders },
        signal, // si ton helper http gère signal ; sinon ignoré
      });
      if (signal?.aborted) return;
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setSpaces(list);
    } catch (e) {
      if (!signal?.aborted) setError(e?.message || "Impossible de charger les espaces.");
    } finally {
      if (!signal?.aborted) setPending(false);
      inflightRef.current = false;
    }
  }, [isLogged, authHeaders]);

  // ⚠️ Un SEUL hook : charge à chaque focus, sans doublons ni clignote
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      load(controller.signal);
      return () => controller.abort();
    }, [load])
  );

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

          {/* Liste */}
          <FlatList
            data={spaces}
            keyExtractor={(it) => String(it.id)}
            refreshControl={
              <RefreshControl
                refreshing={pending}
                onRefresh={() => {
                  const c = new AbortController();
                  load(c.signal);
                }}
              />
            }
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
