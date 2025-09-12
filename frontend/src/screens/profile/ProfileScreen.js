// src/screens/profile/ProfileScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";

import useAuth from "../../hooks/useAuth";
import { json } from "../../services/http";
import styles from "../../styles/ProfileStyles";

const GREEN = "#B7FF27";
const BORDER = "#1f1f1f";

// Rend l'URL absolue si le backend renvoie un chemin relatif
const ABS = (p) =>
  !p
    ? null
    : p.startsWith("http")
    ? p
    : `${(process.env.EXPO_PUBLIC_API_BASE_URL || "")
        .replace(/\/$/, "")}/${String(p).replace(/^\//, "")}`;

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { token, user, setUser, logout, isLogged } = useAuth();

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  // Form state
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");

  const load = useCallback(async () => {
    if (!isLogged) {
      navigation.replace("Login");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      let me = user;
      if (!me) {
        me = await json("/api/user/me", { headers: { ...authHeaders } });
        setUser(me);
      }
      setFirstname(me?.firstname || "");
      setLastname(me?.lastname || "");
      setEmail(me?.email || "");
      setUsername(me?.username || "");
      setPhone(me?.phone_number || "");
      setAge(me?.age != null ? String(me.age) : "");
    } catch (e) {
      setErr(e?.message || "Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  }, [isLogged, user, authHeaders, navigation, setUser]);

  useEffect(() => {
    load();
  }, [load]);

  // Avatar (URL absolue + fallback sur initiale)
  const avatarUri = useMemo(
    () => ABS(user?.avatar || user?.avatar_url),
    [user]
  );
  const [imgOk, setImgOk] = useState(Boolean(avatarUri));
  useEffect(() => {
    setImgOk(Boolean(avatarUri));
  }, [avatarUri]);

  const initial = useMemo(() => {
    const base =
      (firstname && firstname.trim()) ||
      (user?.firstname && user.firstname.trim()) ||
      (user?.email && user.email.trim()) ||
      "U";
    return base[0].toUpperCase();
  }, [firstname, user]);

  const onSave = async () => {
    if (!email.trim()) {
      Alert.alert("Validation", "Email requis");
      return;
    }
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const id = user?.id || user?.user?.id;
      if (!id) throw new Error("ID utilisateur manquant");

      const payload = {
        firstname: firstname.trim() || null,
        lastname: lastname.trim() || null,
        email: email.trim(),
        username: username.trim() || null,
        phone_number: phone.trim() || null,
        age: age === "" ? null : Number(age),
      };

      const updated = await json(`/api/user/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });

      setUser(updated);
      setOk("Profil mis à jour");
      setEdit(false);
    } catch (e) {
      setErr(e?.message || "Mise à jour impossible");
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  if (loading) {
    return (
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={{ color: "#aaa", marginTop: 8 }}>Chargement…</Text>
        </SafeAreaView>
      </Layout>
    );
  }

  return (
    <RoleGuard anyOf={["ROLE_USER","ROLE_ADMIN"]}>
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <SafeAreaView style={[styles.container, { backgroundColor: "#000" }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.title}>Mon profil</Text>

              {/* Identité */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View style={styles.avatar}>
                  {avatarUri && imgOk ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatarImg}
                      resizeMode="cover"
                      onError={() => setImgOk(false)}
                      onLoad={() => setImgOk(true)}
                    />
                  ) : (
                    <Text style={styles.avatarText}>{initial}</Text>
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.nameLine}>
                    {[firstname, lastname].filter(Boolean).join(" ") ||
                      username ||
                      "Utilisateur"}
                  </Text>
                  <Text style={styles.muted}>{email || "—"}</Text>
                </View>

                {!edit ? (
                  <TouchableOpacity
                    onPress={() => setEdit(true)}
                    style={[styles.btn, styles.btnGhost]}
                  >
                    <Ionicons name="create-outline" size={16} color="#B7FF27" />
                    <Text style={styles.btnGhostText}>Modifier</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Rôles */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Rôles</Text>
                <Text style={styles.muted}>
                  {Array.isArray(user?.roles)
                    ? user.roles.join(", ")
                    : user?.role || "ROLE_USER"}
                </Text>
              </View>

              {/* Formulaire d’édition */}
              {edit && (
                <View style={styles.card}>
                  <Field label="Prénom">
                    <TextInput
                      value={firstname}
                      onChangeText={setFirstname}
                      placeholder="Prénom"
                      placeholderTextColor="#777"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Nom">
                    <TextInput
                      value={lastname}
                      onChangeText={setLastname}
                      placeholder="Nom"
                      placeholderTextColor="#777"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Email">
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="vous@exemple.com"
                      placeholderTextColor="#777"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Username">
                    <TextInput
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      placeholder="username"
                      placeholderTextColor="#777"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Téléphone">
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder="+33…"
                      placeholderTextColor="#777"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Âge">
                    <TextInput
                      value={age}
                      onChangeText={setAge}
                      keyboardType="number-pad"
                      placeholder="ex: 30"
                      placeholderTextColor="#777"
                      style={inputStyle}
                    />
                  </Field>
                </View>
              )}

              {/* Messages */}
              {err ? <Text style={styles.error}>{err}</Text> : null}
              {ok ? <Text style={styles.success}>{ok}</Text> : null}

              {/* Actions */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                {edit ? (
                  <>
                    <TouchableOpacity
                      onPress={onSave}
                      disabled={saving}
                      style={[styles.btn, styles.btnPrimary, saving && styles.btnDisabled]}
                    >
                      <Ionicons name="save-outline" size={16} color="#000" />
                      <Text style={styles.btnPrimaryText}>
                        {saving ? "Enregistrement…" : "Enregistrer"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setEdit(false);
                        load();
                      }}
                      style={[styles.btn, styles.btnGhost]}
                    >
                      <Text style={styles.btnGhostText}>Annuler</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity onPress={onLogout} style={[styles.btn, styles.btnDanger]}>
                    <Ionicons name="log-out-outline" size={16} color="#fff" />
                    <Text style={styles.btnDangerText}>Se déconnecter</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Layout>
    </RoleGuard>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: BORDER }}>
      <Text style={{ color: "#9ca3af", marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
}

const inputStyle = {
  backgroundColor: "#0f0f0f",
  borderWidth: 1,
  borderColor: BORDER,
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: "#fff",
  width: "100%",
};
