// src/screens/dashboard/DashboardScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import useAuth from "../../hooks/useAuth";
import RoleGuard from "../../guards/RoleGuard";
import { json } from "../../services/http";
import styles from "../../styles/DashboardStyles";

// -------------------- utils --------------------
const GREEN = "#A6FF00";

const toFloat = (v) => {
  if (v == null) return 0;
  const f = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(f) ? f : 0;
};

const getInterval = (s) => {
  const t = (s?.subscription_type || "").toLowerCase();
  if (t.includes("year")) return "yearly";
  if (t.includes("week")) return "weekly";
  if (t.includes("day")) return "daily";
  return "monthly";
};

const getMonthlyAmount = (s) => {
  const amount = toFloat(s?.amount);
  switch (getInterval(s)) {
    case "yearly": return amount / 12;
    case "weekly": return amount * (52 / 12);
    case "daily":  return amount * 30;
    default:       return amount;
  }
};

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonthsSafe = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };

const startOfISOWeek = (d) => {
  const x = new Date(d);
  const wd = x.getDay(); // 0=Dim..6=Sam
  const diff = (wd === 0 ? -6 : 1) - wd; // aller au lundi
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
};

const nextDueFromStart = (startISO, interval, endISO) => {
  if (!startISO) return null;
  const start = new Date(startISO);
  const now = new Date();
  if (endISO && new Date(endISO) < now) return null;
  let next = new Date(start);
  for (let i = 0; i < 200 && next < now; i++) {
    if (interval === "yearly") next.setFullYear(next.getFullYear() + 1);
    else if (interval === "weekly") next.setDate(next.getDate() + 7);
    else if (interval === "daily") next.setDate(next.getDate() + 1);
    else next = addMonthsSafe(next, 1);
  }
  return next;
};

const toYMD = (d) => d.toISOString().slice(0, 10);
const monthLabelFR = (d) => d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
const formatEUR = (n) => `${(n ?? 0).toFixed(2).replace(".", ",")} €`;

const formatWeekRangeFR = (weekStart) => {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const left = weekStart.toLocaleDateString("fr-FR", sameMonth ? { day: "numeric" } : { day: "numeric", month: "long" });
  const right = weekEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return `${left}–${right}`;
};

// -------------------- screen --------------------
export default function DashboardScreen() {
  const nav = useNavigation();
  const { isLogged, token, user } = useAuth();

  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // calendrier
  const [mode, setMode] = useState("week"); // 'week' | 'month'
  const [weekStart, setWeekStart] = useState(startOfISOWeek(new Date()));
  const [cursor, setCursor] = useState(new Date()); // mois courant
  const [selectedYMD, setSelectedYMD] = useState(null);

  const displayName = user?.firstname || user?.email || "Utilisateur";
  const now = new Date();

  // ---- data load ----
  const loadSubs = useCallback(async () => {
    if (!isLogged || !token) return;
    setLoading(true);
    setErr(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      // On tente "mine" puis fallback "all"
      const data = await json("/api/subscription/mine", { headers }).catch(() =>
        json("/api/subscription/all", { headers })
      );
      setSubs(Array.isArray(data) ? data : data?.items ?? []);
    } catch (e) {
      setErr(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [isLogged, token]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  // ---- derived ----
  const { activeSubs, totalMonthly, upcomingMap } = useMemo(() => {
    const active = (subs || [])
      .filter((s) => (s?.status || "active") === "active")
      .map((s) => {
        const inter = getInterval(s);
        const due = nextDueFromStart(s.start_date, inter, s.end_date);
        return {
          ...s,
          _interval: inter,
          _monthly: getMonthlyAmount(s),
          _nextDue: due,
          _nextKey: due ? toYMD(due) : null,
        };
      });
    const tm = active.reduce((sum, s) => sum + (s._monthly || 0), 0);
    const map = new Map();
    for (const s of active) {
      if (!s._nextKey) continue;
      const arr = map.get(s._nextKey) || [];
      arr.push(s);
      map.set(s._nextKey, arr);
    }
    return { activeSubs: active, totalMonthly: tm, upcomingMap: map };
  }, [subs]);

  const days = useMemo(() => {
    if (mode === "week") {
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
    // month
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const out = [];
    for (let d = new Date(first); d < nextMonth; d.setDate(d.getDate() + 1)) out.push(new Date(d));
    return out;
  }, [mode, weekStart, cursor]);

  const filteredList = useMemo(() => {
    if (selectedYMD) return (upcomingMap.get(selectedYMD) || []).slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (mode === "week") {
      const keys = Array.from({ length: 7 }, (_, i) => toYMD(addDays(weekStart, i)));
      return keys.flatMap((k) => upcomingMap.get(k) || []);
    }
    return [];
  }, [upcomingMap, selectedYMD, mode, weekStart]);

  // ---- actions ----
  const goAdd = () => nav.navigate("AddSubscription");
  const goVoirPlusDepenses = () => nav.navigate("ActiveSubscription");
  const goVoirPlusCalendar = () => {
    if (selectedYMD) nav.navigate("ActiveSubscription", { day: selectedYMD });
    else nav.navigate("ActiveSubscription", { weekStart: toYMD(weekStart) });
  };

  // -------------------- UI --------------------
  return (
    <RoleGuard anyOf={["ROLE_USER","ROLE_ADMIN"]}>
    <Layout scroll={false} header={<AppHeader />} footer={<AppFooter />}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Onglets */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.activeTab}><Text style={styles.activeTabText}>Vous</Text></TouchableOpacity>
          <TouchableOpacity style={styles.inactiveTab} onPress={() => nav.navigate("SpacesScreen")}>
            <Text style={styles.inactiveTabText}>Espaces</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>Bonjour {displayName}</Text>

        {/* CTA Ajouter */}
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.primaryBtnLg} onPress={goAdd}>
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.primaryBtnLgText}>AJOUTER UN ABONNEMENT</Text>
          </TouchableOpacity>
        </View>

        {/* Dépenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dépenses</Text>
            <TouchableOpacity onPress={goVoirPlusDepenses}><Text style={styles.seeMore}>Voir plus</Text></TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Ionicons name="calendar" size={16} /> {monthLabelFR(now)}
            </Text>
            <Text style={styles.cardText}>
              <Ionicons name="layers" size={16} /> {activeSubs.length} abonnements
            </Text>
            {loading
              ? <Text style={styles.cardText}>Calcul…</Text>
              : err
                ? <Text style={styles.cardText}>Erreur : {err}</Text>
                : <Text style={styles.amount}>{formatEUR(totalMonthly)} <Text style={styles.perMonth}>/mois</Text></Text>}
          </View>
        </View>

        {/* Calendrier */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Calendrier</Text>
          <TouchableOpacity onPress={goVoirPlusCalendar}><Text style={styles.seeMore}>Voir plus</Text></TouchableOpacity>
        </View>

        {/* Filtres semaine/mois + nav */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <TouchableOpacity
            style={mode === "week" ? styles.activeFilter : styles.inactiveFilter}
            onPress={() => { setMode("week"); setWeekStart(startOfISOWeek(new Date())); setSelectedYMD(null); }}
          >
            <Text style={mode === "week" ? styles.activeFilterText : styles.inactiveFilterText}>Semaine</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={mode === "month" ? styles.activeFilter : styles.inactiveFilter}
            onPress={() => { setMode("month"); setCursor(new Date()); setSelectedYMD(null); }}
          >
            <Text style={mode === "month" ? styles.activeFilterText : styles.inactiveFilterText}>Mois</Text>
          </TouchableOpacity>

          {mode === "week" && (
            <>
              <TouchableOpacity style={styles.smallPill} onPress={() => setWeekStart(addDays(weekStart, -7))}>
                <Ionicons name="chevron-back" size={16} />
              </TouchableOpacity>
              <Text style={{ color: "#aaa" }}>Semaine du {formatWeekRangeFR(weekStart)}</Text>
              <TouchableOpacity style={styles.smallPill} onPress={() => setWeekStart(addDays(weekStart, 7))}>
                <Ionicons name="chevron-forward" size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallPill}
                onPress={() => { setWeekStart(startOfISOWeek(new Date())); setSelectedYMD(null); }}
              >
                <Text style={{ color: "#fff" }}>Aujourd’hui</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "month" && (
            <>
              <TouchableOpacity
                style={styles.smallPill}
                onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                <Ionicons name="chevron-back" size={16} />
              </TouchableOpacity>
              <Text style={{ color: "#aaa" }}>{monthLabelFR(cursor)}</Text>
              <TouchableOpacity
                style={styles.smallPill}
                onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                <Ionicons name="chevron-forward" size={16} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Jours */}
        <View
          style={[
            styles.calendarContainer,
            mode === "month" ? { flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 } : null,
          ]}
        >
          {days.map((d) => {
            const key = toYMD(d);
            const isSel = key === selectedYMD;
            const hasDue = upcomingMap.has(key);
            return (
              <TouchableOpacity
                key={key}
                style={isSel ? styles.selectedDate : styles.date}
                onPress={() => setSelectedYMD(isSel ? null : key)}
              >
                <Text style={isSel ? styles.selectedDateText : styles.dateText}>{d.getDate()}</Text>
                {hasDue ? <View style={styles.dueDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Liste du jour / semaine */}
        {filteredList.length > 0 ? (
          filteredList.map((s) => (
            <View key={s.id} style={[styles.subscriptionCard, { marginTop: 10 }]}>
              <View style={styles.subscriptionLeft}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>{(s.name || "Abo").slice(0, 1)}</Text>
                </View>
                <View>
                  <Text style={styles.subscriptionTitle}>{s.name || "—"}</Text>
                  <Text style={styles.subscriptionDesc}>
                    Échéance le {s._nextDue ? s._nextDue.toLocaleDateString("fr-FR") : "—"}
                  </Text>
                </View>
              </View>
              <Text style={styles.subscriptionPrice}>
                {formatEUR(getMonthlyAmount(s))} <Text style={styles.perMonth}>/mois</Text>
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={22} color="#666" />
            <Text style={styles.emptyText}>Aucun abonnement pour le moment.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={goAdd}>
              <Text style={styles.primaryBtnText}>AJOUTER</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={{
          position: "absolute", right: 20, bottom: 30,
          backgroundColor: GREEN, width: 56, height: 56, borderRadius: 28,
          alignItems: "center", justifyContent: "center",
        }}
        onPress={goAdd}
      >
        <Ionicons name="add" size={26} color="#000" />
      </TouchableOpacity>
    </Layout>
    </RoleGuard>
  );
}
