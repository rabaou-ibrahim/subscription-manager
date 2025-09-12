// src/screens/auth/RegisterScreen.js
import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { Snackbar, ActivityIndicator } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import AppInput from "../../ui/AppInput";
import useAuth from "../../hooks/useAuth";
import Layout from "../../ui/Layout";

const GREEN = "#B7FF27";
const BORDER = "#1f1f1f";

export default function RegisterScreen() {
  const nav = useNavigation();
  const { register } = useAuth();

  // required
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname]   = useState("");
  const [email, setEmail]         = useState("");
  const [pw, setPw]               = useState("");
  const [pw2, setPw2]             = useState("");

  // optional
  const [username, setUsername]       = useState("");
  const [phone, setPhone]             = useState("");
  const [age, setAge]                 = useState("");
  const [avatar, setAvatar]           = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(null);
  const [err, setErr] = useState(null);

  const validate = () => {
    const e = {};
    if (!firstname.trim()) e.firstname = "Prénom requis";
    if (!lastname.trim())  e.lastname  = "Nom requis";
    if (!email.trim())     e.email     = "Email requis";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Email invalide";
    if (!pw) e.pw = "Mot de passe requis";
    else if (pw.length < 8) e.pw = "Au moins 8 caractères";
    if (pw2 !== pw) e.pw2 = "Les mots de passe ne correspondent pas";

    if (phone.trim()) {
      if (!/^\+?[0-9]{7,15}$/.test(phone.trim()))
        e.phone = "Téléphone invalide (ex: +33612345678)";
    }
    if (age.trim()) {
      const n = Number(age);
      if (!Number.isInteger(n) || n < 0) e.age = "Âge invalide";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErr(null); setOk(null);
    try {
      await register({
        firstname,
        lastname,
        email,
        password: pw,
        username: username || null,
        phone_number: phone || null,
        age: age === "" ? null : Number(age),
        avatar: avatar || null,
      });
      setOk("Compte créé ! Connecte-toi maintenant.");
      setTimeout(() => nav.navigate("Login"), 700);
    } catch (e) {
      setErr(e.message || "Inscription impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout scroll={false} style={{ backgroundColor: "#000" }}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <AppHeader />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
                Créer un compte
              </Text>

              {/* Required */}
              <Text style={s.label}>Prénom</Text>
              <AppInput icon="person-outline" value={firstname}
                onChangeText={(v) => { setFirstname(v); if (errors.firstname) setErrors(x => ({ ...x, firstname: undefined })); }}
                placeholder="Ton prénom" error={errors.firstname} returnKeyType="next" />

              <Text style={s.label}>Nom</Text>
              <AppInput icon="id-card-outline" value={lastname}
                onChangeText={(v) => { setLastname(v); if (errors.lastname) setErrors(x => ({ ...x, lastname: undefined })); }}
                placeholder="Ton nom" error={errors.lastname} returnKeyType="next" />

              <Text style={s.label}>Email</Text>
              <AppInput icon="mail-outline" value={email}
                onChangeText={(v) => { setEmail(v); if (errors.email) setErrors(x => ({ ...x, email: undefined })); }}
                placeholder="vous@exemple.com" keyboardType="email-address" autoCapitalize="none"
                error={errors.email} returnKeyType="next" />

              <Text style={s.label}>Mot de passe</Text>
              <AppInput icon="key-outline" value={pw}
                onChangeText={(v) => { setPw(v); if (errors.pw) setErrors(x => ({ ...x, pw: undefined })); }}
                placeholder="Au moins 8 caractères" secure error={errors.pw} returnKeyType="next" />

              <Text style={s.label}>Confirmer le mot de passe</Text>
              <AppInput icon="shield-checkmark-outline" value={pw2}
                onChangeText={(v) => { setPw2(v); if (errors.pw2) setErrors(x => ({ ...x, pw2: undefined })); }}
                placeholder="Confirmer le mot de passe" secure error={errors.pw2} returnKeyType="next" />

              {/* Optional */}
              <Text style={s.label}>Pseudo (username)</Text>
              <AppInput icon="at-outline" value={username}
                onChangeText={setUsername} placeholder="Ex: rabaou" returnKeyType="next" />

              <Text style={s.label}>Téléphone (optionnel)</Text>
              <AppInput icon="call-outline" value={phone}
                onChangeText={(v) => { setPhone(v); if (errors.phone) setErrors(x => ({ ...x, phone: undefined })); }}
                placeholder="+33612345678" keyboardType="phone-pad" error={errors.phone} returnKeyType="next" />

              <Text style={s.label}>Âge (optionnel)</Text>
              <AppInput icon="calendar-outline" value={age}
                onChangeText={(v) => { setAge(v); if (errors.age) setErrors(x => ({ ...x, age: undefined })); }}
                placeholder="Ex: 28" keyboardType="numeric" error={errors.age} returnKeyType="next" />

              <Text style={s.label}>Avatar (URL — optionnel)</Text>
              <AppInput icon="image-outline" value={avatar}
                onChangeText={setAvatar} placeholder="https://..." returnKeyType="go"
                onSubmitEditing={onSubmit} />

              <TouchableOpacity onPress={onSubmit} disabled={loading} activeOpacity={0.9}
                style={{
                  marginTop: 12, height: 48, borderRadius: 12,
                  backgroundColor: GREEN, alignItems: "center", justifyContent: "center",
                  opacity: loading ? 0.6 : 1,
                }}>
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>S’inscrire</Text>
              </TouchableOpacity>

              <View style={{ marginTop: 12, alignItems: "center" }}>
                <TouchableOpacity onPress={() => nav.navigate("Login")}>
                  <Text style={{ color: "#9aa0a6", textDecorationLine: "underline" }}>
                    Déjà un compte ? Se connecter
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <AppFooter />

        <Snackbar visible={!!ok} onDismiss={() => setOk(null)} duration={2600} style={{ backgroundColor: "#4caf50" }}>
          {ok}
        </Snackbar>
        <Snackbar visible={!!err} onDismiss={() => setErr(null)} duration={3300} style={{ backgroundColor: "#f44336" }}>
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

const s = {
  label: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 10, marginBottom: 6 },
};
