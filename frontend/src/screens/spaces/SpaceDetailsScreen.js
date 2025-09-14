// src/screens/spaces/SpaceDetailsScreen.js
import React, { useCallback, useMemo, useRef, useState } from "react";
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
import RoleGuard from "../../guards/RoleGuard";
import ModalSelect from "../../ui/ModalSelect";

const REL_OPTIONS = [
  { key: "friend",  label: "Ami(e)" },
  { key: "parent",  label: "Parent" },
  { key: "child",   label: "Enfant" },
  { key: "partner", label: "Partenaire" },
  { key: "other",   label: "Autre" },
];
const relLabel = (k) => REL_OPTIONS.find(o => o.key === k)?.label || k;
const visLabel = (v) => (v === "public" ? "Public" : "Privé");

const ROLE_META = {
  owner:   { label: "Owner",  icon: "ribbon-outline",            bg: "#0ea5e9", fg: "#000" },
  admin:   { label: "Admin",  icon: "shield-checkmark-outline",  bg: "#a78bfa", fg: "#000" },
  member:  { label: "Membre", icon: "people-outline",            bg: "#34d399", fg: "#000" },
  invited: { label: "Invité", icon: "mail-unread-outline",       bg: "#f59e0b", fg: "#000" },
  restricted: { label: "Restreint", icon: "lock-closed-outline", bg: "#6b7280", fg: "#000" },
};

function RoleBadge({ role }) {
  const r = ROLE_META[role] || ROLE_META.restricted;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: r.bg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Ionicons name={r.icon} size={12} color={r.fg} />
      <Text style={{ color: r.fg, fontWeight: "700", fontSize: 11 }}>{r.label}</Text>
    </View>
  );
}

export default function SpaceDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, user } = useAuth();

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const spaceId = route.params?.id;
  const myUserId = user?.id;

  const [space, setSpace] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [relModal, setRelModal] = useState(false);
  const [relKey, setRelKey] = useState("friend");

  const canManage =
    !!(space?.permissions?.canManage) ||
    (space?.created_by?.id && String(space.created_by.id) === String(myUserId)) ||
    (Array.isArray(user?.roles) && user.roles.includes("ROLE_ADMIN"));

  // Barrière anti-double-load
  const inflightRef = useRef(false);

  const load = useCallback(
    async (signal) => {
      if (!spaceId || inflightRef.current) return;
      inflightRef.current = true;
      setLoading(true);
      try {
        // 1) d’abord l’espace (contient role/permissions)
        const s = await json(`/api/space/${spaceId}`, { headers: { ...authHeaders }, signal });
        if (signal?.aborted) return;
        setSpace(s);

        // 2) Ensuite seulement si autorisé
        if (s?.permissions?.canViewMembers) {
          const [mRes, iRes] = await Promise.allSettled([
            json(`/api/member/all?space_id=${encodeURIComponent(spaceId)}`, { headers: { ...authHeaders }, signal }),
            json(`/api/member/invitations?space_id=${encodeURIComponent(spaceId)}`, { headers: { ...authHeaders }, signal })
              .catch(() => json(`/api/invite/all?space_id=${encodeURIComponent(spaceId)}`, { headers: { ...authHeaders }, signal })),
          ]);
          if (signal?.aborted) return;

          setMembers(
            mRes.status === "fulfilled" ? (Array.isArray(mRes.value) ? mRes.value : mRes.value.items ?? []) : []
          );
          setInvites(
            iRes.status === "fulfilled" ? (Array.isArray(iRes.value) ? iRes.value : iRes.value.items ?? []) : []
          );
        } else {
          setMembers([]);
          setInvites([]);
        }
      } catch (e) {
        if (e?.status === 403) {
          // accès existant mais refusé → on affiche la page avec bandeau restreint
          setSpace({
            id: spaceId,
            name: "Espace",
            visibility: "private",
            description: "",
            permissions: { canManage: false, canViewMembers: false },
            role: "restricted",
          });
          setMembers([]);
          setInvites([]);
        } else if (!signal?.aborted) {
          Alert.alert("Erreur", e?.message || "Espace introuvable.");
          setSpace(null);
          setMembers([]);
          setInvites([]);
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
        inflightRef.current = false;
      }
    },
    [spaceId, authHeaders]
  );

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      load(controller.signal);
      return () => controller.abort();
    }, [load])
  );

  const onAddMember = async () => {
    const email = String(emailInput).trim().toLowerCase();
    if (!email) {
      Alert.alert("Email requis", "Saisis un email.");
      return;
    }
    try {
      const res = await json("/api/member/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          space_id: String(spaceId),
          email,
          relationship: relKey || "friend",
        }),
      });

      if (res?.member) {
        setMembers((prev) => [res.member, ...prev]);
        Alert.alert("OK", "Membre ajouté.");
      } else if (res?.invite) {
        setInvites((prev) => [res.invite, ...prev]);
        Alert.alert("OK", "Invitation envoyée.");
      } else {
        const c = new AbortController();
        await load(c.signal);
      }

      setShowAdd(false);
      setEmailInput("");
      setRelKey("friend");
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Action impossible.");
    }
  };

  const onResendInvite = async (inviteId) => {
    try {
      await json(`/api/member/invitation/resend/${inviteId}`, { method: "POST", headers: { ...authHeaders } });
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Impossible de renvoyer l’invitation.");
    }
  };

  const onCancelInvite = async (inviteId) => {
    const confirm =
      Platform.OS === "web"
        ? window.confirm("Annuler cette invitation ?")
        : await new Promise((r) => {
            Alert.alert("Confirmer", "Annuler cette invitation ?", [
              { text: "Non", style: "cancel", onPress: () => r(false) },
              { text: "Oui", style: "destructive", onPress: () => r(true) },
            ]);
          });
    if (!confirm) return;

    try {
      await json(`/api/member/invitation/cancel/${inviteId}`, { method: "POST", headers: { ...authHeaders } });
      setInvites((prev) => prev.filter((i) => String(i.id) !== String(inviteId)));
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
      <RoleGuard anyOf={["ROLE_USER", "ROLE_ADMIN"]}>
        <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ color: "#fff" }}>Espace introuvable.</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : navigation.navigate("SpacesScreen")
              }
              style={{ marginTop: 12 }}
            >
              <Text style={{ color: "#A6FF00", fontWeight: "700" }}>Retour</Text>
            </TouchableOpacity>
          </View>
        </Layout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard anyOf={["ROLE_USER", "ROLE_ADMIN"]}>
      <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor: "#000" }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          {space?.permissions && !space.permissions.canManage && (
            <View
              style={{
                backgroundColor: "#151515",
                borderColor: "#333",
                borderWidth: 1,
                padding: 10,
                borderRadius: 10,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons name="lock-closed-outline" size={16} color="#B7FF27" />
              <Text style={{ color: "#ccc", flex: 1 }}>
                Accès restreint — vous êtes {space.role === "invited" ? "invité" : "membre"} de cet espace.
              </Text>
            </View>
          )}

          {/* Infos espace */}
          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: "#1f1f1f",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#9ca3af", marginBottom: 8 }}>Nom</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16, flex: 1 }}>
                {space.name || "—"}
              </Text>
              {/* Rôle visuel juste à côté du nom */}
              <RoleBadge role={space.role} />
            </View>

            <Text style={{ color: "#9ca3af", marginBottom: 8 }}>Visibilité</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Ionicons
                name={space.visibility === "public" ? "globe-outline" : "lock-closed-outline"}
                size={16}
                color="#B7FF27"
              />
              <Text style={{ color: "#fff" }}>{visLabel(space.visibility)}</Text>
            </View>

            <Text style={{ color: "#9ca3af", marginBottom: 8 }}>Description</Text>
            <Text style={{ color: "#fff" }}>{space.description || "—"}</Text>
          </View>

          {/* Membres */}
          <View
            style={{
              backgroundColor: "#0f0f0f",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#1f1f1f",
              padding: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: "#B7FF27", fontWeight: "700", flex: 1 }}>
                Membres ({members.length})
              </Text>

              {canManage && (
                <TouchableOpacity
                  onPress={() => setShowAdd(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#A6FF00",
                    borderRadius: 10,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                  }}
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
                  <Text style={{ color: "#ede" }}>{m.name || "Membre"}</Text>
                  <Text style={{ color: "#999", fontSize: 12 }}>{relLabel(m.relationship) || "—"}</Text>
                </View>
              ))
            )}
          </View>

          {/* Invitations */}
          {canManage && (
            <View
              style={{
                backgroundColor: "#0f0f0f",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#1f1f1f",
                padding: 12,
                marginTop: 12,
              }}
            >
              <Text style={{ color: "#B7FF27", fontWeight: "700", marginBottom: 8 }}>
                Invitations en attente
              </Text>

              {invites.length === 0 ? (
                <Text style={{ color: "#999" }}>Aucune invitation en attente.</Text>
              ) : (
                invites.map((inv) => (
                  <View
                    key={inv.id}
                    style={{
                      paddingVertical: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#1f1f1f",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#ede" }}>{inv.email}</Text>
                      <Text style={{ color: "#999", fontSize: 12 }}>
                        {relLabel(inv.relationship) || "—"}{" "}
                        {inv.expires_at ? `· expire le ${inv.expires_at}` : ""}
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

          {/* CTA → abonnements */}
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
        <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 16 }}>
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
              <TouchableOpacity
                onPress={() => setRelModal(true)}
                style={{
                  color: "#eee",
                  borderWidth: 1,
                  borderColor: "#262626",
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 12,
                  marginBottom: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#eee" }}>{relLabel(relKey)}</Text>
                <Ionicons name="chevron-down" size={16} color="#bbb" />
              </TouchableOpacity>

              <ModalSelect
                visible={relModal}
                title="Relation"
                options={REL_OPTIONS.map((o) => o.label)}
                value={relLabel(relKey)}
                onChange={(label) => {
                  const k = REL_OPTIONS.find((o) => o.label === label)?.key || "friend";
                  setRelKey(k);
                  setRelModal(false);
                }}
                onClose={() => setRelModal(false)}
                compact
                columns={2}
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
    </RoleGuard>
  );
}
