// src/components/screens/SpaceCreateScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Snackbar } from "react-native-paper";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import ModalSelect from "../../ui/ModalSelect";

import useAuth from "../../hooks/useAuth";
import { json } from "../../services/http";
import styles from "../../styles/SpaceCreateStyles";

export default function SpaceCreateScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [showVis, setShowVis] = useState(false);

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(null);

  const onSubmit = async () => {
    if (!name.trim()) {
      (typeof window !== "undefined" ? window.alert : Alert.alert)("Nom requis", "Merci de saisir un nom.");
      return;
    }

    setPending(true);
    setFormError(null);

    try {
      // 1) Créer l’espace
      const space = await json("/api/space/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          logo: "default.png",
          visibility,
          status: "active",
        }),
      });

      const spaceObj = space?.id ? space : space?.space || space;
      const spaceId = spaceObj?.id;
      if (!spaceId) throw new Error("ID de l'espace introuvable après création.");

      // 2) Récupérer mon nom (optionnel)
      let displayName = "Moi";
      try {
        const me = await json("/api/user/me", { headers: { ...authHeaders } });
        displayName =
          [me?.firstname, me?.lastname].filter(Boolean).join(" ") ||
          me?.email ||
          "Moi";
      } catch (_) {}

      // 3) Me créer comme membre (owner/self)
      try {
        await json("/api/member/create", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            name: displayName,        // requis
            relationship: "self",     // clé attendue
            space_id: String(spaceId) // clé attendue
          }),
        });
      } catch (e) {
        // Non bloquant : l’espace est créé quand même
        console.log("create member(owner) failed:", e?.message || e);
      }

      // 4) Aller sur les détails de l’espace
      navigation.replace("SpaceDetails", { id: spaceId, refreshAt: Date.now() });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Création impossible";
      setFormError(msg);
      (typeof window !== "undefined" ? window.alert : Alert.alert)("Erreur", msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <Layout
      scroll={false}
      header={<AppHeader />}
      footer={<AppFooter />}
      style={{ backgroundColor: "#000" }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Créer un espace</Text>

        <Text style={styles.label}>Nom</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ex: Famille, Coloc, Projet…"
          placeholderTextColor="#777"
          style={styles.input}
        />

        <Snackbar visible={!!formError} onDismiss={() => setFormError(null)}>
          {formError}
        </Snackbar>

        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Quelques mots…"
          placeholderTextColor="#777"
          style={[styles.input, { height: 100 }]}
          multiline
        />

        <Text style={styles.label}>Visibilité</Text>
        <TouchableOpacity
          style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
          onPress={() => setShowVis(true)}
        >
          <Text style={{ color: "#fff" }}>{visibility === "public" ? "Public" : "Privé"}</Text>
          <Text style={{ color: "#A6FF00", fontWeight: "700" }}>Choisir</Text>
        </TouchableOpacity>

        <ModalSelect
          visible={showVis}
          title="Visibilité"
          options={["private", "public"]}
          value={visibility}
          onChange={(v) => { setVisibility(v); setShowVis(false); }}
          onClose={() => setShowVis(false)}
          compact
          columns={2}
        />

        <TouchableOpacity style={styles.cta} onPress={onSubmit} disabled={pending}>
          <Text style={styles.ctaText}>{pending ? "Création..." : "Créer"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </Layout>
  );
}
