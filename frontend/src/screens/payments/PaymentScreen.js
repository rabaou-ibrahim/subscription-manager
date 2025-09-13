// src/screens/payments/PaymentScreen.js
import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import useAuth from "../../hooks/useAuth";
import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import { createPayment, updatePayment } from "../../services/payments";

const methods = [
  { key: "credit_card", label: "Carte" },
  { key: "paypal", label: "PayPal" },
  { key: "bank_transfer", label: "Virement" },
];

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();

  const { subscriptionId, amount, currency = "EUR", onPaid } = route.params || {};
  const [method, setMethod] = useState("credit_card");
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState(""); // MVP: libre / optionnel

  const payNow = async () => {
    if (!subscriptionId || amount == null) {
      Alert.alert("Données manquantes", "Abonnement ou montant introuvable.");
      return;
    }

    try {
      setLoading(true);

      // 1) Créer la ligne Payment (status = pending)
      const created = await createPayment(
        { subscriptionId, amount, currency, paymentMethod: method, transactionId: txId || null },
        token
      );
      const paymentId = created?.payment?.id || created?.id || created?.paymentId;
      if (!paymentId) throw new Error("Création du paiement impossible.");

      // 2) Si virement → on reste en 'pending' (validation manuelle plus tard)
      if (method === "bank_transfer") {
        Alert.alert("En attente", "Virement enregistré. Nous validerons le paiement dès réception.");
        onPaid?.();
        navigation.goBack();
        return;
      }

      // 3) Sinon, confirmer (status = completed) + transaction_id
      await updatePayment(
        { paymentId, status: "completed", transactionId: txId || "DEMO-XYZ" },
        token
      );

      Alert.alert("Succès", "Paiement confirmé.");
      onPaid?.(); // rafraîchit l’écran SubscriptionsDetails
      navigation.goBack();
    } catch (e) {
      const msg = e?.message || "Paiement impossible.";
      Alert.alert("Erreur", msg);
      if (msg.includes("401")) {
        // session expirée ou token manquant
        navigation.navigate("Login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
      <View style={{ flex: 1, backgroundColor: "#000", padding: 16 }}>
        <Text style={{ color: "#72CE1D", fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
          Paiement de l’abonnement
        </Text>

        <View style={{ backgroundColor: "#1A1A1A", borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <Text style={{ color: "#C8B6E2" }}>Montant</Text>
          <Text style={{ color: "#fff", fontSize: 18, marginTop: 4 }}>
            {amount} {currency}
          </Text>
        </View>

        <Text style={{ color: "#C8B6E2", marginBottom: 8 }}>Méthode</Text>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {methods.map((m) => (
            <TouchableOpacity
              key={m.key}
              onPress={() => setMethod(m.key)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 2,
                borderColor: method === m.key ? "#72CE1D" : "#333",
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginRight: 10,
                backgroundColor: "#1A1A1A",
              }}
            >
              <Ionicons
                name={method === m.key ? "radio-button-on" : "radio-button-off"}
                size={18}
                color="#72CE1D"
              />
              <Text style={{ color: "#fff", marginLeft: 6 }}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {method === "bank_transfer" && (
          <Text style={{ color: "#C8B6E2", marginBottom: 8 }}>
            Astuce : laisse vide le TX si tu veux, le paiement restera en attente.
          </Text>
        )}

        {/* MVP : champ Transaction ID libre/optionnel */}
        <Text style={{ color: "#C8B6E2", marginBottom: 6 }}>Transaction ID (optionnel)</Text>
        <TextInput
          value={txId}
          onChangeText={setTxId}
          placeholder="DEMO-XYZ"
          placeholderTextColor="#777"
          style={{
            backgroundColor: "#1A1A1A",
            color: "#fff",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "#333",
            marginBottom: 20,
          }}
        />

        <TouchableOpacity
          onPress={payNow}
          disabled={loading}
          style={{
            backgroundColor: "#72CE1D",
            borderRadius: 12,
            alignItems: "center",
            paddingVertical: 12,
          }}
        >
          {loading ? <ActivityIndicator /> : <Text style={{ fontWeight: "700" }}>Payer maintenant</Text>}
        </TouchableOpacity>
      </View>
    </Layout>
  );
}
