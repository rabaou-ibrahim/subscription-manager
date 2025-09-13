import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { Snackbar, ActivityIndicator } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import AppInput from "../../ui/AppInput";
import Layout from "../../ui/Layout";
import useAuth from "../../hooks/useAuth";

const GREEN = "#B7FF27";
const BORDER = "#1f1f1f";

export default function LoginScreen() {
  const nav = useNavigation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(null);
  const [err, setErr] = useState(null);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email requis";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Email invalide";
    if (!password) e.password = "Mot de passe requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErr(null); setOk(null);
    try {
      await login(email.trim(), password);
      nav.reset({ index: 0, routes: [{ name: "Home" }] });
      setOk("Connexion réussie !");
    } catch (e) {
       const msg = e?.message || "Échec de la connexion";
       setErr(msg);                              
       setErrors({ email: msg, password: " " });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout scroll={false} style={{ backgroundColor: "#000" }}>
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <AppHeader />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
          <View style={{
            alignSelf: "center",
            width: "100%",
            maxWidth: 560,
            backgroundColor: "#0f0f0f",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: BORDER,
          }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
              Connexion
            </Text>

            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
              Email
            </Text>
            <AppInput
              icon="mail-outline"
              value={email}
              onChangeText={(v) => { setEmail(v); if (errors.email) setErrors(x => ({ ...x, email: undefined })); }}
              placeholder="vous@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              returnKeyType="next"
            />

            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 10, marginBottom: 6 }}>
              Mot de passe
            </Text>
            <AppInput
              icon="key-outline"
              value={password}
              onChangeText={(v) => { setPassword(v); if (errors.password) setErrors(x => ({ ...x, password: undefined })); }}
              placeholder="Votre mot de passe"
              secure
              error={errors.password}
              returnKeyType="go"
              onSubmitEditing={onSubmit}
            />

            <TouchableOpacity
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.9}
              style={{
                marginTop: 12, height: 48, borderRadius: 12,
                backgroundColor: GREEN, alignItems: "center", justifyContent: "center",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>Se connecter</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 12, alignItems: "center" }}>
              <TouchableOpacity onPress={() => nav.navigate("Register")}>
                <Text style={{ color: "#9aa0a6", textDecorationLine: "underline" }}>
                  Créer un compte
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppFooter />

      <Snackbar visible={!!ok} onDismiss={() => setOk(null)} duration={2500} style={{ backgroundColor: "#4caf50" }}>
        {ok}
      </Snackbar>
      <Snackbar visible={!!err} onDismiss={() => setErr(null)} duration={3200} style={{ backgroundColor: "#f44336" }}>
        {err}
      </Snackbar>

      {loading && (
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center",
        }}>
          <ActivityIndicator animating size="large" />
        </View>
      )}
    </View>
    </Layout>
  );
}
