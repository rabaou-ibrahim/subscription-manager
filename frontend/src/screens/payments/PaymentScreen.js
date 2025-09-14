// src/screens/payments/PaymentScreen.js
import React, { useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import useAuth from "../../hooks/useAuth";
import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import { METHODS, pay } from "../../services/payments";

const METHOD_ITEMS = [
  { key: METHODS.credit_card, label: "Carte", icon: "card-outline" },
  { key: METHODS.paypal,      label: "PayPal", icon: "logo-paypal" },
  { key: METHODS.bank_transfer, label: "Virement", icon: "swap-horizontal" },
];

const fmtMoney = (a, c = "EUR") => {
  try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: c }).format(Number(a)); }
  catch { return `${a} ${c}`; }
};

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();

  const { subscriptionId, amount, currency = "EUR", onPaid } = route.params || {};
  const [method, setMethod] = useState(METHODS.credit_card);
  const [txId, setTxId] = useState("");
  const [loading, setLoading] = useState(false);
  const inflight = useRef(false);

  const amountLabel = useMemo(() => fmtMoney(amount ?? 0, currency), [amount, currency]);

  const payNow = async () => {
    if (inflight.current) return;
    if (!subscriptionId || amount == null) {
      Alert.alert("Données manquantes", "Abonnement ou montant introuvable.");
      return;
    }
    inflight.current = true;
    setLoading(true);

    try {
      // TX auto pour carte/PayPal si laissé vide
      const finalTx = txId?.trim() || (method !== METHODS.bank_transfer ? `SIM-${Date.now().toString(36).toUpperCase()}` : null);

      const res = await pay(
        { subscriptionId, amount, currency, method, transactionId: finalTx },
        token
      );

      if (res.status === "pending") {
        Alert.alert("En attente", "Virement enregistré. Nous validerons le paiement à réception.");
      } else {
        Alert.alert("Succès", "Paiement confirmé.");
      }

      onPaid?.();              // refresh l'écran précédent (détails)
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Paiement impossible.");
    } finally {
      setLoading(false);
      inflight.current = false;
    }
  };

  return (
    <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
      <View style={{ flex: 1, backgroundColor: "#000", padding: 16, gap: 12 }}>
        <Text style={{ color: "#72CE1D", fontSize: 20, fontWeight: "700" }}>
          Paiement de l’abonnement
        </Text>

        <View style={{ backgroundColor: "#1A1A1A", borderRadius: 12, padding: 12 }}>
          <Text style={{ color: "#C8B6E2" }}>Montant</Text>
          <Text style={{ color: "#fff", fontSize: 18, marginTop: 4 }}>{amountLabel}</Text>
        </View>

        <Text style={{ color: "#C8B6E2" }}>Méthode</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {METHOD_ITEMS.map((m) => {
            const active = method === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMethod(m.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: active ? "#72CE1D" : "#333",
                  backgroundColor: "#1A1A1A",
                }}
              >
                <Ionicons name={m.icon} size={18} color="#72CE1D" />
                <Text style={{ color: "#fff" }}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {method === METHODS.bank_transfer && (
          <Text style={{ color: "#9aa0a6" }}>
            Astuce : laisse le TX vide, le paiement restera en attente (validation manuelle).
          </Text>
        )}

        <Text style={{ color: "#C8B6E2" }}>Transaction ID (optionnel)</Text>
        <TextInput
          value={txId}
          onChangeText={setTxId}
          placeholder={method === METHODS.bank_transfer ? "ex: RECU-123" : "auto si vide"}
          placeholderTextColor="#777"
          style={{
            backgroundColor: "#1A1A1A",
            color: "#fff",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "#333",
          }}
        />

        <TouchableOpacity
          onPress={payNow}
          disabled={loading}
          style={{
            marginTop: 8,
            backgroundColor: "#72CE1D",
            borderRadius: 12,
            alignItems: "center",
            paddingVertical: 12,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? <ActivityIndicator /> : <Text style={{ fontWeight: "700" }}>Payer maintenant</Text>}
        </TouchableOpacity>
      </View>
    </Layout>
  );
}
