// src/screens/notifications/NotificationsScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";

import useAuth from "../../hooks/useAuth";
import styles from "../../styles/NotificationsStyles";
import { listNotifications, markNotificationRead, deleteNotification } from "../../services/notifications";

const GREEN = "#B7FF27";

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { token, isLogged } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pendingId, setPendingId] = useState(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    if (!isLogged) { navigation.replace("Login"); return; }
    setLoading(true);
    try {
      const list = await listNotifications(authHeaders);
      setItems(list);
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  }, [isLogged, navigation, token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(n =>
      (n.title || "").toLowerCase().includes(s) ||
      (n.message || n.body || "").toLowerCase().includes(s)
    );
  }, [items, q]);

  const onMarkRead = async (id) => {
    setPendingId(id);
    try {
      await markNotificationRead(id, authHeaders);
      setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Action impossible");
    } finally {
      setPendingId(null);
    }
  };

  const onDelete = async (id) => {
    const prev = items;
    setItems(prev.filter(n => n.id !== id)); // optimiste
    try {
      await deleteNotification(id, authHeaders);
    } catch (e) {
      setItems(prev); // rollback
      Alert.alert("Erreur", e?.message || "Suppression impossible");
    }
  };

  const renderItem = ({ item }) => {
    const title = item.title || "Notification";
    const body = item.message || item.body || "";
    const unread = !item.read;

    return (
      <View style={styles.item}>
        <View style={styles.itemRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={unread ? "notifications" : "notifications-outline"} size={18} color={unread ? GREEN : "#9aa0a6"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {!!body && <Text style={styles.body}>{body}</Text>}

            <View style={styles.metaRow}>
              {unread && (
                <View style={styles.badgeUnread}>
                  <Text style={styles.badgeUnreadText}>Non lu</Text>
                </View>
              )}
              {!!item.created_at && (
                <Text style={{ color: "#6b7280", fontSize: 12 }}>
                  {new Date(item.created_at).toLocaleString("fr-FR")}
                </Text>
              )}
            </View>

            <View style={styles.actionsRow}>
              {unread && (
                <TouchableOpacity
                  onPress={() => onMarkRead(item.id)}
                  style={[styles.btn, styles.btnGhost]}
                  disabled={pendingId === item.id}
                >
                  <Ionicons name="checkmark-done-outline" size={16} color="#ddd" />
                  <Text style={styles.btnGhostText}>{pendingId === item.id ? "…" : "Marquer lu"}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.btn, styles.btnDanger]}>
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.btnDangerText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={{ color: "#9aa0a6", marginTop: 8 }}>Chargement…</Text>
        </SafeAreaView>
      </Layout>
    );
  }

  return (
    <RoleGuard anyOf={["ROLE_USER","ROLE_ADMIN"]}>
    <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color="#6b6b6b" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher une notification…"
            placeholderTextColor="#6b6b6b"
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={26} color="#6b7280" />
              <Text style={styles.emptyText}>Aucune notification.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Layout>
    </RoleGuard>
  );
}
