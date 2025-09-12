// src/screens/spaces/SpaceDetailsScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ActivityIndicator, Alert, TouchableOpacity, ScrollView,
  Modal, TextInput, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";

import useAuth from "../../hooks/useAuth";
import { json } from "../../services/http";
import styles from "../../styles/SpaceDetailsStyles";

export default function SpaceDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, user } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const spaceId = route.params?.id;
  const myUserId = user?.id;
  const [space, setSpace] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal ajout membre/invite
  const [showAdd, setShowAdd] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [relInput, setRelInput] = useState("friend");
  const canManage = useMemo(() => {
    const isOwner = space?.created_by?.id && String(space.created_by.id) === String(myUserId);
    const hasAdmin = Array.isArray(user?.roles) && user.roles.includes("ROLE_ADMIN");
    return isOwner || hasAdmin;
  }, [space, user, myUserId]);

  const fetchSpace = useCallback(async () => {
    const data = await json(`/api/space/${spaceId}`, { headers: { ...authHeaders } });
    setSpace(data);
  }, [spaceId, authHeaders]);

  const fetchMembers = useCallback(async () => {
    // Pas d’endpoint "members by space" → on filtre /member/all
    const data = await json("/api/member/all", { headers: { ...authHeaders } });
    const arr = Array.isArray(data) ? data : data?.items ?? [];
    const list = arr.filter(m =>
      String(m?.space?.id ?? m?.space_id) === String(spaceId)
    );
    setMembers(list);
  }, [spaceId, authHeaders]);

  const fetchInvites = useCallback(async () => {
    // Router: GET /api/member/invitations (ou /api/invite/all). On filtre par spaceId.
    try {
      const data = await json("/api/member/invitations", { headers: { ...authHeaders } })
        .catch(() => json("/api/invite/all", { headers: { ...authHeaders } }));
      const arr = Array.isArray(data) ? data : data?.items ?? [];
      const list = arr.filter(inv =>
        String(inv?.space?.id ?? inv?.space_id) === String(spaceId)
      );
      setInvites(list);
    } catch {
      setInvites([]);
    }
  }, [spaceId, authHeaders]);

  const load = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchSpace(),
        fetchMembers(),
        fetchInvites()
      ]);
    } catch (e) {
      Alert.alert("Erreur", "Espace introuvable.");
      setSpace(null);
      setMembers([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, [spaceId, fetchSpace, fetchMembers, fetchInvites]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const onAddMember = async () => {
    const email = String(emailInput).trim().toLowerCase();
    if (!email) {
      Alert.alert("Email requis", "Saisis un email.");
      return;
    }
    try {
      // POST /api/member/create
      // Le backend peut : (a) ajouter membre si user existe ; (b) créer une invitation sinon
      const res = await json("/api/member/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          space_id: String(spaceId),
          email,
          relationship: relInput || "friend",
          // name: optionnel (le backend peut dériver du user/email)
        }),
      });

      // Heuristiques de réponse
      if (res?.member) {
        setMembers(prev => [res.member, ...prev]);
        Alert.alert("OK", "Membre ajouté.");
      } else if (res?.invite) {
        setInvites(prev => [res.invite, ...prev]);
        Alert.alert("OK", "Invitation envoyée.");
      } else {
        // fallback: recharger
        await Promise.all([fetchMembers(), fetchInvites()]);
        Alert.alert("Info", "Opération effectuée.");
      }

      setShowAdd(false);
      setEmailInput("");
      setRelInput("friend");
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Action impossible.");
    }
  };

  const onResendInvite = async (inviteId) => {
    try {
      await json(`/api/member/invitation/resend/${inviteId}`, {
        method: "POST",
        headers: { ...authHeaders },
      });
      Alert.alert("OK", "Invitation renvoyée.");
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Impossible de renvoyer l’invitation.");
    }
  };

  const onCancelInvite = async (inviteId) => {
    const confirm = Platform.OS === "web"
      ? window.confirm("Annuler cette invitation ?")
      : await new Promise(r => {
          Alert.alert("Confirmer", "Annuler cette invitation ?", [
            { text: "Non", style: "cancel", onPress: () => r(false) },
            { text: "Oui", style: "destructive", onPress: () => r(true) },
          ]);
        });

    if (!confirm) return;

    try {
      await json(`/api/member/invitation/cancel/${inviteId}`, {
        method: "POST", // (route accepte POST|DELETE)
        headers: { ...authHeaders },
      });
      setInvites(prev => prev.filter(i => String(i.id) !== String(inviteId)));
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Annulation impossible.");
    }
  };

  if (loading) {
    return (
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ color: "#9aa0a6", marginTop: 8 }}>Chargement…</Text>
        </View>
      </Layout>
    );
  }

  if (!space) {
    return (
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ color: "#fff" }}>Espace introuvable.</Text>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("SpacesScreen"))}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: "#A6FF00", fontWeight: "700" }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </Layout>
    );
  }

  return (
    <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Infos espace */}
        <View style={{ backgroundColor: "#111", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#1f1f1f", marginBottom: 12 }}>
          <Text style={{ color: "#9ca3af", marginBottom: 8 }}>Nom</Text>
          <Text style={{ color: "#fff", marginBottom: 12 }}>{space.name || "—"}</Text>

          <Text style={{ color: "#9ca3af", marginBottom: 8 }}>Visibilité</Text>
          <Text style={{ color: "#fff", marginBottom: 12 }}>{space.visibility || "—"}</Text>

          <Text style={{ color: "#9ca3af", marginBottom: 8 }}>Description</Text>
          <Text style={{ color: "#fff" }}>{space.description || "—"}</Text>
        </View>

        {/* Membres */}
        <View style={{ backgroundColor: "#0f0f0f", borderRadius: 12, borderWidth: 1, borderColor: "#1f1f1f", padding: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: "#B7FF27", fontWeight: "700", flex: 1 }}>
              Membres ({members.length})
            </Text>

            {canManage && (
              <TouchableOpacity
                onPress={() => setShowAdd(true)}
                style={{ borderWidth: 1, borderColor: "#A6FF00", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 }}
              >
                <Text style={{ color: "#A6FF00", fontWeight: "700" }}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>

          {members.length === 0 ? (
            <Text style={{ color: "#999" }}>Aucun membre pour le moment.</Text>
          ) : (
            members.map((m) => (
              <View key={m.id} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#1f1f1f" }}>
                <Text style={{ color: "#ede" }}>{m.name || m.user?.firstname || "Membre"}</Text>
                <Text style={{ color: "#999", fontSize: 12 }}>{m.relationship || "—"}</Text>
              </View>
            ))
          )}
        </View>

        {/* Invitations */}
        {canManage && (
          <View style={{ backgroundColor: "#0f0f0f", borderRadius: 12, borderWidth: 1, borderColor: "#1f1f1f", padding: 12, marginTop: 12 }}>
            <Text style={{ color: "#B7FF27", fontWeight: "700", marginBottom: 8 }}>Invitations en attente</Text>

            {invites.length === 0 ? (
              <Text style={{ color: "#999" }}>Aucune invitation en attente.</Text>
            ) : (
              invites.map((inv) => (
                <View
                  key={inv.id}
                  style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#1f1f1f", flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ede" }}>{inv.email || inv.invited_email}</Text>
                    <Text style={{ color: "#999", fontSize: 12 }}>
                      {inv.relationship || "—"} {inv.expires_at ? `· expire le ${inv.expires_at}` : ""}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => onResendInvite(inv.id)}>
                    <Ionicons name="reload" size={18} color="#A6FF00" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => onCancelInvite(inv.id)}>
                    <Ionicons name="trash" size={18} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* CTA → abonnements de cet espace */}
        <View style={{ marginTop: 16 }}>
          <TouchableOpacity
            style={{
              backgroundColor: "#A6FF00",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
            onPress={() =>
              navigation.navigate("SubscriptionList", {
                spaceId,
                spaceName: space?.name,
                createdById: space?.created_by?.id,
              })
            }
          >
            <Ionicons name="albums" size={18} color="#000" />
            <Text style={{ color: "#000", fontWeight: "700" }}>
              Voir les abonnements de cet espace
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal ajout membre / invitation */}
      <Modal
        visible={showAdd}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdd(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#0f0f0f",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: "#1f1f1f",
            }}
          >
            <Text style={{ color: "#B7FF27", fontWeight: "700", marginBottom: 10 }}>
              Ajouter un membre
            </Text>

            <Text style={{ color: "#9ca3af", marginBottom: 6 }}>Email</Text>
            <TextInput
              placeholder="prenom@exemple.com"
              placeholderTextColor="#777"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                color: "#eee",
                borderWidth: 1,
                borderColor: "#262626",
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                marginBottom: 10,
              }}
              value={emailInput}
              onChangeText={setEmailInput}
            />

            <Text style={{ color: "#9ca3af", marginBottom: 6 }}>Lien (relationship)</Text>
            <TextInput
              placeholder="ami, famille, collègue…"
              placeholderTextColor="#777"
              style={{
                color: "#eee",
                borderWidth: 1,
                borderColor: "#262626",
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                marginBottom: 12,
              }}
              value={relInput}
              onChangeText={setRelInput}
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowAdd(false)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#444",
                }}
              >
                <Text style={{ color: "#bbb" }}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onAddMember}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: "#A6FF00",
                }}
              >
                <Text style={{ color: "#000", fontWeight: "700" }}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Layout>
  );
}
