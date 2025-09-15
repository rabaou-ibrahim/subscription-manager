// src/screens/subscriptions/AddSubscriptionScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput, SafeAreaView, Alert,
  Switch, Platform, ScrollView, KeyboardAvoidingView, Image, Pressable
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRoute, useNavigation } from "@react-navigation/native";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import ServicePickerModal from "../../ui/ServicePickerModal";

import useAuth from "../../hooks/useAuth";
import { json } from "../../services/http";
import styles from "../../styles/AddSubscriptionStyles";
import RoleGuard from "../../guards/RoleGuard";
import { getServiceIconUrl } from "../../util/serviceIcon";

const CURRENCY_OPTIONS = [
  { value: "EUR", label: "€ EUR" },
  { value: "USD", label: "$ USD" },
  { value: "GBP", label: "£ GBP" },
  { value: "CAD", label: "$ CAD" },
  { value: "AUD", label: "$ AUD" },
];

const FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Mensuel" },
  { value: "yearly",  label: "Annuel" },
  { value: "weekly",  label: "Hebdomadaire" },
  { value: "daily",   label: "Quotidien" },
];

const BILLING_OPTIONS = [
  { value: "unknown",     label: "Inconnu" },
  { value: "credit_card", label: "Carte bancaire" },
  { value: "sepa",        label: "Prélèvement SEPA" },
  { value: "paypal",      label: "PayPal" },
  { value: "cash",        label: "Espèces" },
  { value: "other",       label: "Autre" },
];

const STATUS_OPTIONS = [
  { value: "active",   label: "Actif" },
  { value: "inactive", label: "Inactif" },
];

const toLabel = (opts, v) => opts.find(o => o.value === v)?.label || v;
const toOptions = (opts) => opts.map(o => o.label);
const fromLabel = (opts, label) => (opts.find(o => o.label === label) || opts[0]).value;

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
  const { token, user } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const initialMemberId = route.params?.memberId ?? null;
  const initialSpaceId  = route.params?.spaceId ?? null;

  const [memberId, setMemberId] = useState(initialMemberId);
  const [spaceId,  setSpaceId]  = useState(initialSpaceId);
  const [resolving, setResolving] = useState(false);

  const [services, setServices] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const data = await json("/api/service/all", { headers: { ...authHeaders } });
        setServices(Array.isArray(data) ? data : (data?.items ?? []));
      } catch (e) {
        console.warn("load services:", e?.message || e);
      }
    })();
  }, [token]);

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

  useEffect(() => {
    navigation.setOptions?.({ title: "Nouvel abonnement" });
  }, [navigation]);

  // === Résolution *non bloquante* du memberId (pas de création auto d'espace) ===
  useEffect(() => {
    if (memberId || !token) return;
    let cancelled = false;
    setResolving(true);

    (async () => {
      try {
        const data = await json("/api/space/all", { headers: { ...authHeaders } });
        const spaces = Array.isArray(data) ? data : (data?.items ?? []);
        const ordered = initialSpaceId
          ? [{ id: initialSpaceId }, ...spaces.filter(s => s.id !== initialSpaceId)]
          : spaces;

        // essaie d’inférer un memberId si l’API renvoie l’info inline
        for (const sp of ordered) {
          const inline =
            sp.my_member_id ||
            sp.meMemberId ||
            sp.members?.find?.(m => m?.is_me)?.id ||
            sp.members?.find?.(m => m?.user?.id === user?.id)?.id ||
            (user?.email ? sp.members?.find?.(m => m?.user?.email === user.email)?.id : null);

          if (inline) {
            if (!cancelled) {
              setMemberId(inline);
              setSpaceId(prev => prev ?? sp.id);
            }
            return;
          }
        }

        // Sinon, on ne fait rien : création perso (member_id absent)
      } catch (e) {
        console.warn("resolve memberId:", e?.message || e);
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => { cancelled = true; };
  }, [memberId, token, user, initialSpaceId]);

  // items du picker service (avec icône)
  const serviceItems = useMemo(() => {
    return services.map(s => ({
      label: s.name ?? s.title ?? s.id,
      value: s.id,
      icon: getServiceIconUrl(s) || undefined,
    }));
  }, [services]);
  const selectedService = serviceItems.find(x => x.value === serviceId);

  // web → envoyer "YYYY-MM-DD"
  const startISO = Platform.OS === "web" ? (startDate || "") : startDate;
  const endISO   = Platform.OS === "web" ? (endDate   || "") : endDate;

  const validate = () => {
    if (!serviceId) return "Choisis un service.";
    if (!name || name.trim().length < 2) return "Le nom est requis (≥ 2 caractères).";
    if (!startISO || !/^\d{4}-\d{2}-\d{2}$/.test(startISO)) return "La date de début doit être JJ/MM/AAAA.";
    if (!FREQUENCY_OPTIONS.some(o => o.value === cycle)) return "Fréquence invalide.";
    if (!CURRENCY_OPTIONS.some(o => o.value === currency)) return "Devise invalide.";
    if (!STATUS_OPTIONS.some(o => o.value === status)) return "Statut invalide.";
    if (!BILLING_OPTIONS.some(o => o.value === billingMode)) return "Mode de facturation invalide.";
    return null;
  };

  const handleCreate = async () => {
    if (resolving) {
      Alert.alert("Encore 1 seconde", "On prépare ton espace…");
      return;
    }
    const err = validate();
    if (err) return Alert.alert("Validation", err);

    const payload = {
      service_id: serviceId,
      name: name.trim(),
      subscription_type: "custom",
      billing_frequency: cycle,
      start_date: startISO,
      end_date: endISO || null,
      billing_mode: billingMode,
      auto_renewal: !!autoRenewal,
      status,
      notes: notes?.trim() || null,
      amount: twoDecimals(amount),
      currency,
      ...(memberId ? { member_id: memberId } : {}), // ← perso si absent
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
      Alert.alert("Erreur", e?.message || "Création impossible");
    }
  };

  const textWhite = { color: "#fff" };
  const placeholderCol = "#8e8e8e";

  return (
    <RoleGuard roles={["ROLE_USER","ROLE_ADMIN"]}>
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }} scroll={false}>
        <SafeAreaView style={[styles.container, { backgroundColor: "#0a0a0a" }]}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
              <View style={styles.formContainer}>
                {resolving ? (<Text style={{ color: "#9cdcfe", marginBottom: 8 }}>Préparation…</Text>) : null}

                {/* Service */}
                <Text style={[styles.label, { color:"#fff" }]}>Service</Text>
                <TouchableOpacity
                  style={[styles.input, { flexDirection:"row", alignItems:"center", justifyContent:"space-between", gap:10 }]}
                  onPress={() => setShowService(true)}
                >
                  <View style={{ flexDirection:"row", alignItems:"center", gap:10, flex:1 }}>
                    {selectedService?.icon ? (
                      Platform.OS === 'web' ? (
                        <img src={selectedService.icon} alt="" style={{ width:20, height:20, borderRadius:4, objectFit:"cover" }} />
                      ) : (
                        <Image source={{ uri: selectedService.icon }} style={{ width:20, height:20, borderRadius:4 }} />
                      )
                    ) : (
                      <View style={{ width:20, height:20, borderRadius:4, backgroundColor:"#1f1f1f" }} />
                    )}
                    <Text style={{ color:"#eee", flexShrink:1 }} numberOfLines={1}>
                      {selectedService?.label || "Sélectionner"}
                    </Text>
                  </View>
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
                  <Text style={{ color: "#eee" }}>{toLabel(CURRENCY_OPTIONS, currency)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#72CE1D" />
                </TouchableOpacity>

                {/* Cycle */}
                <Text style={[styles.label, textWhite]}>Cycle</Text>
                <TouchableOpacity
                  style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                  onPress={() => setShowCycle(true)}
                >
                  <Text style={{ color: "#eee" }}>{toLabel(FREQUENCY_OPTIONS, cycle)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#72CE1D" />
                </TouchableOpacity>

                {/* Début */}
                <Text style={[styles.label, { color:"#fff" }]}>Début</Text>
                {Platform.OS === "web" ? (
                  <View style={[styles.input, { paddingVertical: 6, justifyContent:"center" }]}>
                    <input
                      type="date"
                      lang="fr-FR"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:"#eee" }}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={{ color: "#eee" }}>{startDate || "YYYY-MM-DD"}</Text>
                    <Ionicons name="calendar" size={20} color="#72CE1D" />
                  </TouchableOpacity>
                )}

                {/* Fin (optionnel) */}
                <Text style={[styles.label, { color:"#fff" }]}>Fin (optionnel)</Text>
                {Platform.OS === "web" ? (
                  <View style={[styles.input, { paddingVertical: 6, justifyContent:"center" }]}>
                    <input
                      type="date"
                      lang="fr-FR"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:"#eee" }}
                    />
                  </View>
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
                  <Text style={{ color: "#eee" }}>{toLabel(BILLING_OPTIONS, billingMode)}</Text>
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
                  <Text style={{ color: "#eee" }}>{toLabel(STATUS_OPTIONS, status)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#72CE1D" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.button, resolving && { opacity: .6, pointerEvents: "none" }]}
              disabled={resolving}
              onPress={handleCreate}
              accessibilityRole="button"
              accessibilityLabel="Créer l’abonnement"
            >
              <Text style={styles.buttonText}>{resolving ? "Préparation…" : "Créer"}</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>

          {/* === Modals === */}
          <ServicePickerModal
            visible={showService}
            title="Choisir un service"
            items={serviceItems}
            selectedValue={serviceId}
            onPick={(item) => { setServiceId(item.value); setShowService(false); }}
            onClose={() => setShowService(false)}
          />

          <ServicePickerModal
            visible={showCurrency}
            title="Devise"
            options={toOptions(CURRENCY_OPTIONS)}
            value={toLabel(CURRENCY_OPTIONS, currency)}
            onChange={(label) => { setCurrency(fromLabel(CURRENCY_OPTIONS, label)); setShowCurrency(false); }}
            onClose={() => setShowCurrency(false)}
            compact columns={3}
          />

          <ServicePickerModal
            visible={showCycle}
            title="Cycle"
            options={toOptions(FREQUENCY_OPTIONS)}
            value={toLabel(FREQUENCY_OPTIONS, cycle)}
            onChange={(label) => { setCycle(fromLabel(FREQUENCY_OPTIONS, label)); setShowCycle(false); }}
            onClose={() => setShowCycle(false)}
            compact columns={2}
          />

          <ServicePickerModal
            visible={showBilling}
            title="Mode de facturation"
            options={toOptions(BILLING_OPTIONS)}
            value={toLabel(BILLING_OPTIONS, billingMode)}
            onChange={(label) => { setBillingMode(fromLabel(BILLING_OPTIONS, label)); setShowBilling(false); }}
            onClose={() => setShowBilling(false)}
            compact columns={2}
          />

          <ServicePickerModal
            visible={showStatusModal}
            title="Statut"
            options={toOptions(STATUS_OPTIONS)}
            value={toLabel(STATUS_OPTIONS, status)}
            onChange={(label) => { setStatus(fromLabel(STATUS_OPTIONS, label)); setShowStatusModal(false); }}
            onClose={() => setShowStatusModal(false)}
            compact columns={2}
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
    </RoleGuard>
  );
}
