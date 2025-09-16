// src/screens/admin/ServicesAdminScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, SafeAreaView,
  ActivityIndicator, Alert, Modal, ScrollView, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import ModalSelect from "../../ui/ModalSelect";
import RoleGuard from "../../guards/RoleGuard";

import useAuth from "../../hooks/useAuth";
import { json } from "../../services/http";
import styles from "../../styles/ServicesAdminStyles";
import { getServiceIconUrl } from "../../util/serviceIcon";

const CURRENCIES = ["EUR","USD","GBP","CAD","AUD"];
const STATUSES   = ["active","inactive"];

export default function ServicesAdminScreen() {
  return (
    <RoleGuard roles={["ROLE_ADMIN"]}>
      <ServicesAdminInner />
    </RoleGuard>
  );
}

function ServicesAdminInner() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [categories, setCategories] = useState([]);
  const [services, setServices]     = useState([]);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider]       = useState("");
  const [website, setWebsite]         = useState("");
  const [logo, setLogo]               = useState("");
  const [currency, setCurrency]       = useState("EUR");
  const [status, setStatus]           = useState("active");
  const [categoryId, setCategoryId]   = useState(null);

  const [showCat, setShowCat] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const catItems = useMemo(() => (
    (categories||[]).map(c => ({ label: c.name, value: String(c.id) }))
  ), [categories]);

  const loadAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [cats, svcs] = await Promise.all([
        json("/api/category/all", { headers: { ...authHeaders } }),
        json("/api/service/all",  { headers: { ...authHeaders } }),
      ]);
      setCategories(Array.isArray(cats) ? cats : (cats?.items ?? []));
      setServices(Array.isArray(svcs) ? svcs : (svcs?.items ?? []));
    } catch (e) {
      setErr(e?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = useMemo(() => {
    let arr = services;
    if (catFilter) {
      arr = arr.filter(s => String(s?.category?.id ?? s?.category_id) === String(catFilter));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(s =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.provider || "").toLowerCase().includes(q)
      );
    }
    return arr;
  }, [services, search, catFilter]);

  const onNew = () => {
    setEditing(null);
    setName(""); setDescription(""); setProvider(""); setWebsite(""); setLogo("");
    setCurrency("EUR"); setStatus("active"); setCategoryId(null);
    setOpen(true);
  };

  const onEdit = (svc) => {
    setEditing(svc);
    setName(svc?.name || "");
    setDescription(svc?.description || "");
    setProvider(svc?.provider || "");
    setWebsite(svc?.website || "");
    setLogo(svc?.logo || "");
    setCurrency(svc?.currency || "EUR");
    setStatus(svc?.status || "active");
    setCategoryId(String(svc?.category?.id ?? svc?.category_id ?? ""));
    setOpen(true);
  };

  const validate = () => {
    if (!name.trim()) return "Le nom est requis.";
    if (!description.trim()) return "La description est requise.";
    if (!CURRENCIES.includes(currency)) return "Devise invalide.";
    if (!STATUSES.includes(status)) return "Statut invalide.";
    if (!categoryId) return "Sélectionne une catégorie.";
    return null;
  };

  const onSave = async () => {
    const v = validate();
    if (v) { Alert.alert("Validation", v); return; }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      provider: provider.trim() || null,
      logo: logo.trim() || null,
      website: website.trim() || null,
      status,
      currency,
      category_id: categoryId,
    };

    try {
      if (editing?.id) {
        await json(`/api/service/update/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type":"application/json", ...authHeaders },
          body: JSON.stringify(payload),
        });
      } else {
        await json("/api/service/create", {
          method: "POST",
          headers: { "Content-Type":"application/json", ...authHeaders },
          body: JSON.stringify(payload),
        });
      }
      setOpen(false);
      await loadAll();
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Sauvegarde impossible");
    }
  };

  const onDelete = async (svc) => {
    const ok = Platform.OS === "web"
      ? window.confirm(`Supprimer le service “${svc.name}” ?`)
      : await new Promise(res => {
          Alert.alert("Confirmer", `Supprimer le service “${svc.name}” ?`, [
            { text: "Annuler", style: "cancel", onPress: () => res(false) },
            { text: "Supprimer", style: "destructive", onPress: () => res(true) },
          ]);
        });
    if (!ok) return;

    const prev = services;
    setServices(arr => arr.filter(s => s.id !== svc.id));
    try {
      await json(`/api/service/delete/${svc.id}`, { method: "DELETE", headers: { ...authHeaders } });
    } catch (e) {
      setServices(prev);
      Alert.alert("Erreur", e?.message || "Suppression impossible");
    }
  };

  const renderItem = ({ item }) => {
    const iconUrl = getServiceIconUrl(item);
    return (
      <View style={styles.row}>
        <View style={styles.leftIcon}>
          {iconUrl ? (
            <View style={{ width: 24, height: 24, borderRadius: 4, overflow: "hidden" }}>
            </View>
          ) : (
            <Text style={{ color:"#72CE1D", fontWeight:"800" }}>
              {(item.name || "?").charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex:1, minWidth:0 }}>
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {(item.provider || "—")} · {(item.category?.name || "sans catégorie")}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}>
          <Ionicons name="create-outline" size={18} color="#A6FF00" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item)} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={18} color="#C62828" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor:"#000" }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Services (admin)</Text>
          <TouchableOpacity onPress={onNew} style={styles.newBtn}>
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.newBtnText}>Nouveau</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#A6FF00" />
            <Text style={{ color:"#9aa0a6", marginTop:6 }}>Chargement…</Text>
          </View>
        ) : err ? (
          <Text style={{ color:"#ff6b6b" }}>{err}</Text>
        ) : (
          <>
            {/* Filtres */}
            <View style={styles.toolbar}>
              <View style={styles.search}>
                <Ionicons name="search" size={18} color="#72CE1D" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un service…"
                  placeholderTextColor="#6b6b6b"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <TouchableOpacity
                onPress={() => setCatFilter(null)}
                style={[styles.chip, !catFilter && styles.chipActive]}
              >
                <Text style={[styles.chipText, !catFilter && styles.chipTextActive]}>Toutes</Text>
              </TouchableOpacity>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8 }}>
                {categories.map(c => {
                  const active = String(catFilter) === String(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setCatFilter(active ? null : String(c.id))}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Liste */}
            <FlatList
              data={filtered}
              keyExtractor={(it) => String(it.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={{ color:"#9aa0a6" }}>Aucun service.</Text>}
            />
          </>
        )}

        {/* Modal Create/Edit */}
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editing ? "Modifier un service" : "Nouveau service"}</Text>

              <ScrollView contentContainerStyle={{ gap:10 }}>
                <Field label="Nom" value={name} onChangeText={setName} />
                <Field label="Description" value={description} onChangeText={setDescription} multiline />
                <Field label="Fournisseur" value={provider} onChangeText={setProvider} />
                <Field label="Site web" value={website} onChangeText={setWebsite} autoCapitalize="none" />
                <Field label="Logo (URL)" value={logo} onChangeText={setLogo} autoCapitalize="none" />

                {/* Catégorie */}
                <Text style={styles.label}>Catégorie</Text>
                <TouchableOpacity
                  style={styles.select}
                  onPress={() => setShowCat(true)}
                >
                  <Text style={styles.selectText}>
                    {catItems.find(i => i.value === categoryId)?.label || "Sélectionner"}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#72CE1D" />
                </TouchableOpacity>

                {/* Devise */}
                <Text style={styles.label}>Devise</Text>
                <TouchableOpacity style={styles.select} onPress={() => setShowCur(true)}>
                  <Text style={styles.selectText}>{currency}</Text>
                  <Ionicons name="chevron-down" size={18} color="#72CE1D" />
                </TouchableOpacity>

                {/* Statut */}
                <Text style={styles.label}>Statut</Text>
                <TouchableOpacity style={styles.select} onPress={() => setShowStatus(true)}>
                  <Text style={styles.selectText}>{status}</Text>
                  <Ionicons name="chevron-down" size={18} color="#72CE1D" />
                </TouchableOpacity>

                {/* Actions */}
                <View style={{ flexDirection:"row", gap:8, marginTop:6 }}>
                  <TouchableOpacity onPress={() => setOpen(false)} style={[styles.btn, styles.btnGhost]}>
                    <Text style={styles.btnGhostText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onSave} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>{editing ? "Enregistrer" : "Créer"}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Modals de sélection */}
              <InnerPickers
                showCat={showCat} setShowCat={setShowCat} catItems={catItems}
                categoryId={categoryId} setCategoryId={setCategoryId}
                showCur={showCur} setShowCur={setShowCur} currency={currency} setCurrency={setCurrency}
                showStatus={showStatus} setShowStatus={setShowStatus} status={status} setStatus={setStatus}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Layout>
  );
}

function Field({ label, ...rest }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#666"
        {...rest}
      />
    </View>
  );
}

function InnerPickers({
  showCat, setShowCat, catItems, categoryId, setCategoryId,
  showCur, setShowCur, currency, setCurrency,
  showStatus, setShowStatus, status, setStatus
}) {
  return (
    <>
      <ModalSelect
        visible={showCat}
        title="Catégorie"
        items={catItems}
        value={catItems.find(i => i.value === categoryId)?.label}
        onChangeItem={(it) => setCategoryId(it.value)}
        onClose={() => setShowCat(false)}
        compact
        columns={2}
      />
      <ModalSelect
        visible={showCur}
        title="Devise"
        options={CURRENCIES}
        value={currency}
        onChange={(v) => { setCurrency(v); setShowCur(false); }}
        onClose={() => setShowCur(false)}
        compact
        columns={3}
      />
      <ModalSelect
        visible={showStatus}
        title="Statut"
        options={STATUSES}
        value={status}
        onChange={(v) => { setStatus(v); setShowStatus(false); }}
        onClose={() => setShowStatus(false)}
        compact
        columns={2}
      />
    </>
  );
}
