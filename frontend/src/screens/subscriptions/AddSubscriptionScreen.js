// src/screens/subscriptions/AddSubscriptionScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput, SafeAreaView, Alert,
  Switch, Platform, ScrollView, KeyboardAvoidingView, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRoute, useNavigation } from "@react-navigation/native";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import ModalSelect from "../../ui/ModalSelect";

import useAuth from "../../hooks/useAuth";
import { json } from "../../services/http";
import styles from "../../styles/AddSubscriptionStyles";

// si tu as un util pour l’icône des services, garde-le, sinon enlève l’import
// import { getServiceIconUrl } from "../../utils/serviceIcon";

const CURRENCIES   = ["EUR", "USD", "GBP", "CAD", "AUD"];
const FREQUENCIES  = ["monthly", "yearly", "weekly", "daily"];
const BILLING_MODES = ["unknown", "credit_card", "sepa", "paypal", "cash", "other"];
const STATUSES     = ["active", "inactive", "cancelled", "expired"];

const twoDecimals = (v) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};
const fmtDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : (d || ""));
const parseYMD = (s) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date();
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export default function AddSubscriptionScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token, user } = useAuth(); // user pour fallback email/id
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // params facultatifs
  const initialMemberId = route.params?.memberId ?? null;
  const initialSpaceId  = route.params?.spaceId ?? null;

  // target (espace/membre)
  const [memberId, setMemberId] = useState(initialMemberId);
  const [spaceId,  setSpaceId]  = useState(initialSpaceId);
  const [resolving, setResolving] = useState(false);

  // form
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(null);
  const [showService, setShowService] = useState(false);

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [cycle, setCycle] = useState("monthly");
  const [startDate, setStartDate] = useState(fmtDate(new Date()));
  const [endDate, setEndDate]     = useState("");

  const [billingMode, setBillingMode] = useState("unknown");
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [status, setStatus] = useState("active");

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker]     = useState(false);
  const [showCurrency, setShowCurrency]       = useState(false);
  const [showCycle, setShowCycle]             = useState(false);
  const [showBilling, setShowBilling]         = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // titre / header natif (si tu l’affiches ailleurs, ignore setOptions)
  useEffect(() => {
    navigation.setOptions?.({ title: "Nouvel abonnement" });
  }, [navigation]);

  // charge la liste des services
  useEffect(() => {
    (async () => {
      try {
        const data = await json("/api/service/all", { headers: { ...authHeaders } });
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setServices(list);
        if (!serviceId && list.length) setServiceId(list[0].id);
      } catch (e) {
        console.warn("Services load:", e?.message || e);
      }
    })();
  }, [token]); // recharge si token change

  // résout automatiquement memberId si absent
  useEffect(() => {
    if (memberId || !token) return;
    setResolving(true);
    (async () => {
      try {
        // 1) Tous mes espaces
        const data = await json("/api/space/all", { headers: { ...authHeaders } });
        const spaces = Array.isArray(data) ? data : (data?.items ?? []);
        const ordered = initialSpaceId
          ? [{ id: initialSpaceId }, ...spaces.filter(s => s.id !== initialSpaceId)]
          : spaces;

        // 2) essaie de trouver mon member dans chaque espace
        for (const sp of ordered) {
          // inline hints ?
          const inline =
            sp.my_member_id ||
            sp.meMemberId ||
            sp.members?.find?.(m => m?.is_me)?.id ||
            sp.members?.find?.(m => m?.user?.id === user?.id)?.id ||
            (user?.email ? sp.members?.find?.(m => m?.user?.email === user.email)?.id : null);

          if (inline) { setMemberId(inline); setSpaceId(prev => prev ?? sp.id); return; }

          // Fallback sans /api/member/space/{id}
          try {
            // On récupère tout puis on filtre
            const allMembers = await json("/api/member/all", { headers: { ...authHeaders } });
            const arr = Array.isArray(allMembers) ? allMembers : (allMembers?.items ?? []);

            // Essaie de détecter le membre qui correspond à l'espace courant
            const me =
              arr.find(m => m?.is_me && (m?.space?.id === sp.id || m?.space_id === sp.id)) ||
              arr.find(m => (m?.user?.id === user?.id) && (m?.space?.id === sp.id || m?.space_id === sp.id)) ||
              (user?.email ? arr.find(m => (m?.user?.email === user.email) && (m?.space?.id === sp.id || m?.space_id === sp.id)) : null);

            if (me?.id) { setMemberId(me.id); setSpaceId(prev => prev ?? sp.id); return; }
          } catch {}
        }
      } catch (e) {
        console.warn("resolve memberId:", e?.message || e);
      } finally {
        setResolving(false);
      }
    })();
  }, [memberId, token, user, initialSpaceId]);

  const serviceItems = useMemo(() => {
    return services.map(s => ({
      label: s.name ?? s.title ?? s.id,
      value: s.id,
      // icon: getServiceIconUrl ? getServiceIconUrl(s) : undefined,
    }));
  }, [services]);
  const selectedService = serviceItems.find(x => x.value === serviceId);

  const validate = () => {
    if (!serviceId) return "Choisis un service.";
    if (!name || name.trim().length < 2) return "Le nom est requis (≥ 2 caractères).";
    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return "La date de début doit être YYYY-MM-DD.";
    if (!FREQUENCIES.includes(cycle)) return "Fréquence invalide.";
    if (!CURRENCIES.includes(currency)) return "Devise invalide.";
    if (!STATUSES.includes(status)) return "Statut invalide.";
    if (!BILLING_MODES.includes(billingMode)) return "Mode de facturation invalide.";
    return null;
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) return Alert.alert("Validation", err);

    const payload = {
      service_id: serviceId,
      name: name.trim(),
      subscription_type: "custom",
      billing_frequency: cycle,
      start_date: startDate,
      end_date: endDate || null,
      billing_mode: billingMode,
      auto_renewal: !!autoRenewal,
      status,
      notes: notes?.trim() || null,
      amount: twoDecimals(amount),
      currency,
      ...(memberId ? { member_id: memberId } : {}),
    };

    try {
      const data = await json("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });

      Alert.alert("Succès", "Abonnement créé.");
      const newId = data?.id || data?.subscription?.id;
      if (newId) {
        navigation.navigate("SubscriptionDetails", { id: newId, refreshAt: Date.now() });
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (e) {
      const msg = e?.message || "Inscription de l’abonnement impossible";
      Alert.alert("Erreur", msg);
    }
  };

  const textWhite = { color: "#fff" };
  const placeholderCol = "#8e8e8e";

  return (
    <Layout
      scroll={false}
      header={<AppHeader />}
      footer={<AppFooter />}
      style={{ backgroundColor: "#000" }}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: "#0a0a0a" }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            <View style={styles.formContainer}>
              {resolving ? (
                <Text style={{ color: "#9cdcfe", marginBottom: 8 }}>Préparation…</Text>
              ) : null}

              {/* Service */}
              <Text style={[styles.label, textWhite]}>Service</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                onPress={() => setShowService(true)}
              >
                <Text style={[{ color: "#eee" }]}>
                  {selectedService?.label || "Sélectionner"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#72CE1D" />
              </TouchableOpacity>

              {/* Nom */}
              <Text style={[styles.label, textWhite]}>Nom</Text>
              <TextInput
                style={[styles.input, textWhite]}
                placeholder="Nom de l’abonnement"
                placeholderTextColor={placeholderCol}
                value={name}
                onChangeText={setName}
              />

              {/* Notes */}
              <Text style={[styles.label, textWhite]}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: "top", color: "#eee" }]}
                placeholder="Notes (optionnel)"
                placeholderTextColor={placeholderCol}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              {/* Montant */}
              <Text style={[styles.label, textWhite]}>Montant</Text>
              <TextInput
                style={[styles.input, textWhite]}
                placeholder="0.00"
                placeholderTextColor={placeholderCol}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />

              {/* Devise */}
              <Text style={[styles.label, textWhite]}>Devise</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                onPress={() => setShowCurrency(true)}
              >
                <Text style={{ color: "#eee" }}>{currency}</Text>
                <Ionicons name="chevron-down" size={20} color="#72CE1D" />
              </TouchableOpacity>

              {/* Cycle */}
              <Text style={[styles.label, textWhite]}>Cycle</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                onPress={() => setShowCycle(true)}
              >
                <Text style={{ color: "#eee" }}>{cycle}</Text>
                <Ionicons name="chevron-down" size={20} color="#72CE1D" />
              </TouchableOpacity>

              {/* Début */}
              <Text style={[styles.label, textWhite]}>Début</Text>
              {Platform.OS === "web" ? (
                <TextInput
                  style={[styles.input, textWhite]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={placeholderCol}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={{ color: "#eee" }}>{startDate || "YYYY-MM-DD"}</Text>
                  <Ionicons name="calendar" size={20} color="#72CE1D" />
                </TouchableOpacity>
              )}

              {/* Fin */}
              <Text style={[styles.label, textWhite]}>Fin (optionnel)</Text>
              {Platform.OS === "web" ? (
                <TextInput
                  style={[styles.input, textWhite]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={placeholderCol}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={{ color: "#eee" }}>{endDate || "—"}</Text>
                  <Ionicons name="calendar" size={20} color="#72CE1D" />
                </TouchableOpacity>
              )}

              {/* Mode de facturation */}
              <Text style={[styles.label, textWhite]}>Mode de facturation</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                onPress={() => setShowBilling(true)}
              >
                <Text style={{ color: "#eee" }}>{billingMode}</Text>
                <Ionicons name="chevron-down" size={20} color="#72CE1D" />
              </TouchableOpacity>

              {/* Renouvellement auto */}
              <View style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                <Text style={[styles.label, textWhite, { marginBottom: 0 }]}>Renouvellement auto</Text>
                <Switch value={autoRenewal} onValueChange={setAutoRenewal} />
              </View>

              {/* Statut */}
              <Text style={[styles.label, textWhite]}>Statut</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                onPress={() => setShowStatusModal(true)}
              >
                <Text style={{ color: "#eee" }}>{status}</Text>
                <Ionicons name="chevron-down" size={20} color="#72CE1D" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={handleCreate}>
            <Text style={styles.buttonText}>Créer</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>

        {/* Modals */}
        <ModalSelect
          visible={showService}
          title="Service"
          items={serviceItems}
          value={selectedService?.label}
          onChangeItem={(item) => setServiceId(item.value)}
          onClose={() => setShowService(false)}
          maxHeight={360}
          compact
          columns={2}
          searchable
        />

        <ModalSelect
          visible={showCurrency}
          title="Devise"
          options={CURRENCIES}
          value={currency}
          onChange={(v) => { setCurrency(v); setShowCurrency(false); }}
          onClose={() => setShowCurrency(false)}
          compact
          columns={3}
        />

        <ModalSelect
          visible={showCycle}
          title="Cycle"
          options={FREQUENCIES}
          value={cycle}
          onChange={(v) => { setCycle(v); setShowCycle(false); }}
          onClose={() => setShowCycle(false)}
          compact
          columns={2}
        />

        <ModalSelect
          visible={showBilling}
          title="Mode de facturation"
          options={BILLING_MODES}
          value={billingMode}
          onChange={(v) => { setBillingMode(v); setShowBilling(false); }}
          onClose={() => setShowBilling(false)}
          compact
          columns={2}
        />

        <ModalSelect
          visible={showStatusModal}
          title="Statut"
          options={STATUSES}
          value={status}
          onChange={(v) => { setStatus(v); setShowStatusModal(false); }}
          onClose={() => setShowStatusModal(false)}
          compact
          columns={2}
        />

        {/* Pickers natifs */}
        {showStartPicker && (
          <DateTimePicker
            value={parseYMD(startDate || fmtDate(new Date()))}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            onChange={(_, d) => {
              setShowStartPicker(Platform.OS === "ios");
              if (d) setStartDate(fmtDate(d));
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={parseYMD(endDate || fmtDate(new Date()))}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            onChange={(_, d) => {
              setShowEndPicker(Platform.OS === "ios");
              if (d) setEndDate(fmtDate(d));
            }}
          />
        )}
      </SafeAreaView>
    </Layout>
  );
}
