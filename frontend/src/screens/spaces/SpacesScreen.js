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

const ROLE_META = {
  owner:   { label: "Owner",  icon: "ribbon-outline",            bg: "#0ea5e9", fg: "#000" },
  admin:   { label: "Admin",  icon: "shield-checkmark-outline",  bg: "#a78bfa", fg: "#000" },
  member:  { label: "Membre", icon: "people-outline",            bg: "#34d399", fg: "#000" },
  invited: { label: "Invité", icon: "mail-unread-outline",       bg: "#f59e0b", fg: "#000" },
  unknown: { label: "—",      icon: "help-circle-outline",       bg: "#6b7280", fg: "#000" },
};

function RoleBadge({ role }) {
  const r = ROLE_META[role] || ROLE_META.unknown;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: r.bg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Ionicons name={r.icon} size={12} color={r.fg} />
      <Text style={{ color: r.fg, fontWeight: "700", fontSize: 11 }}>{r.label}</Text>
    </View>
  );
}

export default function SpacesScreen() {
  const navigation = useNavigation();
  const { token, isLogged, user } = useAuth();

  const [spaces, setSpaces] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  // Barrière anti-doublons + abort propre
  const inflightRef = useRef(false);

  const load = useCallback(
    async (signal) => {
      if (!isLogged || inflightRef.current) return;
      inflightRef.current = true;
      setPending(true);
      setError(null);
      try {
        const data = await json("/api/space/all", {
          headers: { ...authHeaders },
          signal,
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
    },
    [isLogged, authHeaders]
  );

  // ⚠️ Un SEUL hook : charge à chaque focus
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

  const detectRole = (it) => {
    if (it?.role) return it.role;
    // fallback minimal : owner si je suis le créateur, sinon membre
    const mine = String(it?.created_by?.id || "") === String(user?.id || "");
    return mine ? "owner" : "member";
  };

  return (
    <RoleGuard anyOf={["ROLE_USER", "ROLE_ADMIN"]}>
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
            renderItem={({ item }) => {
              const role = detectRole(item);
              const visIcon = item.visibility === "public" ? "globe-outline" : "lock-closed-outline";

              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigation.navigate("SpaceDetails", { id: item.id })}
                >
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoLetter}>{(item.name || "?").charAt(0).toUpperCase()}</Text>
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
                        {item.name || "Espace"}
                      </Text>
                      <RoleBadge role={role} />
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name={visIcon} size={12} color="#9aa0a6" />
                      <Text style={[styles.cardSub, { flexShrink: 1 }]} numberOfLines={1}>
                        {item.members_count != null
                          ? `${item.members_count} membre(s)`
                          : item.description || "—"}
                      </Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color="#aaa" />
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      </Layout>
    </RoleGuard>
  );
}
