// src/screens/subscriptions/ActiveSubscriptionScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, StyleSheet,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";

import useAuth from "../../hooks/useAuth";
import { json } from "../../services/http";

import RoleGuard from "../../guards/RoleGuard";

const money = (amount, currency = "EUR") =>
  amount == null
    ? "—"
    : new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(Number(amount));

/** calcule prochaine échéance à partir de start/end et fréquence */
function computeNextDue(sub) {
  if (!sub?.start_date) return null;
  const end = sub?.end_date ? new Date(sub.end_date) : null;
  const today = new Date();
  const status = (sub.status || "active").toLowerCase();
  if (status !== "active") return null;
  if (end && end < today) return null;

  let d = new Date(sub.start_date);
  const step = (sub.billing_frequency || sub.subscription_type || "monthly").toLowerCase();

  const bump = () => {
    if (step.includes("year")) d.setFullYear(d.getFullYear() + 1);
    else if (step.includes("week")) d.setDate(d.getDate() + 7);
    else if (step.includes("day")) d.setDate(d.getDate() + 1);
    else d.setMonth(d.getMonth() + 1);
  };

  while (d <= today) bump();
  if (end && d > end) return null;
  return d; // Date
}

const toYMD = (d) => d?.toISOString?.().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export default function ActiveSubscriptionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, user } = useAuth();

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
  const isAdmin = useMemo(() => (user?.roles || []).includes("ROLE_ADMIN"), [user]);

  // filtres potentiels envoyés par le Dashboard
  const dayFilter = route.params?.day || null;               // "YYYY-MM-DD"
  const weekStartYMD = route.params?.weekStart || null;      // "YYYY-MM-DD"
  const monthFilter = route.params?.month || null;           // "YYYY-MM"

  const [scope, setScope] = useState("mine"); // 'mine' | 'all' (réservé admin)
  const [services, setServices] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // charge services et abonnements
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [svcResp, subsResp] = await Promise.all([
        json("/api/service/all", { headers: { ...authHeaders } }),
        json(isAdmin && scope === "all" ? "/api/subscription/all" : "/api/subscription/mine", {
          headers: { ...authHeaders },
        }),
      ]);
      const svc = Array.isArray(svcResp) ? svcResp : (svcResp?.items ?? []);
      const list = Array.isArray(subsResp) ? subsResp : (subsResp?.items ?? []);

      // ajoute nextDue
      const withDue = list.map(s => ({ ...s, _nextDue: computeNextDue(s) }));
      setServices(svc);
      setSubs(withDue);
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders, isAdmin, scope]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const serviceMap = useMemo(() => {
    const m = new Map();
    (services || []).forEach(s => m.set(String(s.id), s));
    return m;
  }, [services]);

  // applique filtres (jour / semaine / mois)
  const filtered = useMemo(() => {
    let list = subs.filter(s => !!s._nextDue); // seulement ceux qui ont une prochaine échéance
    if (dayFilter) {
      list = list.filter(s => toYMD(s._nextDue) === dayFilter);
    } else if (weekStartYMD) {
      const start = new Date(weekStartYMD);
      const end = addDays(start, 6);
      list = list.filter(s => {
        const d = s._nextDue;
        return d >= start && d <= end;
      });
    } else if (monthFilter) {
      list = list.filter(s => toYMD(s._nextDue)?.slice(0, 7) === monthFilter);
    }
    // tri par date, puis nom
    return list.sort((a, b) => (a._nextDue - b._nextDue) || String(a.name).localeCompare(String(b.name)));
  }, [subs, dayFilter, weekStartYMD, monthFilter]);

  const Empty = () => (
    <View style={{ alignItems: "center", paddingVertical: 40 }}>
      <Ionicons name="card-outline" size={28} color="#666" />
      <Text style={{ color: "#999", marginTop: 8 }}>Aucun abonnement actif.</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("AddSubscription")}
        style={{ marginTop: 12, backgroundColor: "#B7FF27", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 }}
      >
        <Text style={{ fontWeight: "700" }}>Ajouter</Text>
      </TouchableOpacity>
    </View>
  );

  const Row = ({ item }) => {
    const svc = serviceMap.get(String(item.service_id));
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("SubscriptionDetails", { id: item.id, subscription: item })}
        style={s.row}
      >
        <View style={s.leftIcon}>
          <Ionicons name="card" size={22} color="#72CE1D" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.title} numberOfLines={1}>{item.name || svc?.name || "Abonnement"}</Text>
          <Text style={s.subtitle}>
            {money(item.amount, item.currency)}
            {item.billing_frequency ? ` · ${item.billing_frequency}` : ""}
          </Text>
          {item._nextDue && (
            <Text style={s.nextDue}>
              Prochaine échéance : {item._nextDue.toLocaleDateString("fr-FR")}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9aa0a6" />
      </TouchableOpacity>
    );
  };

  return (
    <RoleGuard anyOf={["ROLE_USER","ROLE_ADMIN"]}>
    <Layout scroll={false} header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
      <View style={s.container}>
        {/* Pills filtre d’étendue (admin) */}
        {isAdmin && (
          <View style={s.scopeRow}>
            {["mine", "all"].map(v => {
              const active = scope === v;
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => setScope(v)}
                  style={[s.pill, active ? s.pillActive : s.pillInactive]}
                >
                  <Text style={{ color: active ? "#B7FF27" : "#bbb" }}>
                    {v === "mine" ? "Mes abonnements" : "Tous (admin)"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Résumé filtre */}
        {(dayFilter || weekStartYMD || monthFilter) && (
          <View style={s.filterBanner}>
            <Ionicons name="funnel-outline" size={16} color="#B7FF27" />
            <Text style={s.filterText}>
              Filtre : {dayFilter ? `jour ${dayFilter}` : weekStartYMD ? `semaine depuis ${weekStartYMD}` : `mois ${monthFilter}`}
            </Text>
            <TouchableOpacity onPress={() => navigation.setParams({ day: undefined, weekStart: undefined, month: undefined })}>
              <Text style={s.clearFilter}>Effacer</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#72CE1D" />
            <Text style={{ color: "#72CE1D", marginTop: 8 }}>Chargement…</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(it) => String(it.id)}
            renderItem={Row}
            contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 24 }}
            ListEmptyComponent={<Empty />}
          />
        )}
      </View>
    </Layout>
    </RoleGuard>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#151515",
    borderRadius: 12,
  },
  leftIcon: {
    width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center",
    backgroundColor: "#1f1f1f",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "600" },
  subtitle: { color: "#9aa0a6", marginTop: 2, fontSize: 13 },
  nextDue: { color: "#B7FF27", marginTop: 4, fontSize: 12 },

  scopeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingTop: 12 },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  pillActive: { borderColor: "#B7FF27", backgroundColor: "rgba(183,255,39,0.12)" },
  pillInactive: { borderColor: "#333", backgroundColor: "#121212" },

  filterBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, margin: 12,
    borderRadius: 10, backgroundColor: "#0f0f0f", borderWidth: 1, borderColor: "#262626",
  },
  filterText: { color: "#ddd", flex: 1 },
  clearFilter: { color: "#B7FF27", fontWeight: "700" },
});
