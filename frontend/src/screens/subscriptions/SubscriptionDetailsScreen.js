// src/screens/subscriptions/SubscriptionDetailsScreen.js
import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, Alert, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import useAuth from "../../hooks/useAuth";
import { json } from "../../services/http";
import styles from "../../styles/SubscriptionDetailsStyles";

const fmtPrice = (amount, currency = "EUR") => {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currency}`;
  }
};

const badgeStyle = (status = "active") => {
  const map = {
    active:    { bg: "#1F6F2A", fg: "#D6F5DA", label: "Actif" },
    cancelled: { bg: "#6A1A1A", fg: "#FFD6D6", label: "Annulé" },
    inactive:  { bg: "#3A3A3A", fg: "#EEE",    label: "Inactif" },
    expired:   { bg: "#6A3A1A", fg: "#FFE3CC", label: "Expiré" },
  };
  return map[status] || map.active;
};

const confirmDelete = async (title, message) => {
  if (Platform.OS === "web") return window.confirm(`${title}\n\n${message}`);
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
      { text: "Supprimer", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
};

export default function SubscriptionDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();

  const id =
    route.params?.id ??
    route.params?.subscription?.id ??
    null;

  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState(route.params?.subscription ?? null);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchOne = useCallback(async () => {
    if (!id && !sub) {
      setLoading(false);
      setError("Aucun identifiant fourni.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Pas de GET /subscription/{id} → on charge ma liste et on filtre
      const list = await json("/api/subscription/mine", { headers: { ...authHeaders } });
      const items = Array.isArray(list) ? list : (list?.items ?? []);
      const found = id ? items.find((s) => s.id === id) : null;
      setSub(found || sub || null);
      if (!found && !sub) setError("Abonnement introuvable.");
    } catch (e) {
      setError(e?.message || "Impossible de charger l’abonnement.");
    } finally {
      setLoading(false);
    }
  }, [id, sub, token]);

  useFocusEffect(
    useCallback(() => {
      fetchOne();
    }, [fetchOne, route.params?.refreshAt])
  );

  const onDelete = useCallback(async () => {
    if (!id) return;
    const ok = await confirmDelete(
      "Supprimer l’abonnement",
      `Tu vas supprimer « ${sub?.name || "cet abonnement"} ». Continuer ?`
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await json(`/api/subscription/delete/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders },
      });
      Alert.alert("Supprimé", "L’abonnement a été supprimé.");
      navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Dashboard");
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  }, [id, sub, token]);

  // Écrans d’état
  if (loading) {
    return (
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
          <ActivityIndicator />
          <Text style={styles.muted}>&nbsp;Chargement…</Text>
        </View>
      </Layout>
    );
  }

  if (error || !sub) {
    return (
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <View style={[styles.container, { alignItems: "center", justifyContent: "center", gap: 12 }]}>
          <Text style={styles.muted}>{error || "Abonnement introuvable."}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#000" />
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </Layout>
    );
  }

  const bs = badgeStyle(sub.status);
  const start = sub.start_date ? new Date(sub.start_date).toLocaleDateString("fr-FR") : "—";
  const end   = sub.end_date   ? new Date(sub.end_date).toLocaleDateString("fr-FR")   : "—";

  return (
    <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header local */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{sub.name || "Abonnement"}</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Badge statut */}
        <View style={[styles.badge, { backgroundColor: bs.bg }]}>
          <Text style={[styles.badgeText, { color: bs.fg }]}>{bs.label}</Text>
        </View>

        {/* Carte montant / dates / renouvellement */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="card" size={18} color="#72CE1D" />
            <Text style={styles.rowLabel}>Montant</Text>
            <Text style={styles.rowValue}>
              {fmtPrice(sub.amount, sub.currency)}
              {sub.billing_frequency ? ` · ${sub.billing_frequency}` : ""}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="calendar" size={18} color="#72CE1D" />
            <Text style={styles.rowLabel}>Date de début</Text>
            <Text style={styles.rowValue}>{start}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={18} color="#72CE1D" />
            <Text style={styles.rowLabel}>Date de fin</Text>
            <Text style={styles.rowValue}>{end}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="reload" size={18} color="#72CE1D" />
            <Text style={styles.rowLabel}>Renouvellement</Text>
            <Text style={styles.rowValue}>{sub.auto_renewal ? "Automatique" : "Manuel"}</Text>
          </View>
        </View>

        {/* Détails */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Détails</Text>
          {sub.notes ? <Text style={styles.notes}>{sub.notes}</Text> : <Text style={styles.muted}>Aucune note.</Text>}

          <View style={styles.kv}>
            <Text style={styles.k}>Mode de paiement</Text>
            <Text style={styles.v}>{sub.billing_mode || "—"}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Service associé</Text>
            <Text style={styles.v}>{sub.service?.name || sub.service_name || "—"}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Utilisateur</Text>
            <Text style={styles.v}>
              {sub.member?.user?.firstname || sub.member?.user?.email || sub.member_name || "—"}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              navigation.navigate("CustomSubscription", {
                mode: "edit",
                id,            // id source de vérité
                snapshot: sub, // pour pré-remplir instantanément
              });
            }}
          >
            <Ionicons name="create-outline" size={18} color="#000" />
            <Text style={styles.secondaryBtnText}>Éditer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerBtn, deleting && { opacity: 0.6 }]}
            onPress={onDelete}
            disabled={deleting}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.dangerBtnText}>{deleting ? "Suppression..." : "Supprimer"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Layout>
  );
}
