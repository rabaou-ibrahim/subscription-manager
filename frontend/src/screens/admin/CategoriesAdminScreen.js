import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, SafeAreaView,
  ActivityIndicator, Alert, Modal, ScrollView, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Layout from "../../ui/Layout";
import AppHeader from "../../ui/AppHeader";
import AppFooter from "../../ui/AppFooter";
import RoleGuard from "../../guards/RoleGuard";
import { json } from "../../services/http";
import useAuth from "../../hooks/useAuth";
import styles from "../../styles/CategoriesAdminStyles";

const TYPE_OPTIONS = ["expense", "income", "savings"];

export default function CategoriesAdminScreen() {
  return (
    <RoleGuard roles={["ROLE_ADMIN"]}>
      <CategoriesAdminInner />
    </RoleGuard>
  );
}

function CategoriesAdminInner() {
  const { token } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [color, setColor]         = useState("#64748b");
  const [icon, setIcon]           = useState("tag");
  const [type, setType]           = useState("expense");
  const [isDefault, setIsDefault] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const cats = await json("/api/category/all", { headers: { ...authHeaders } });
      setCategories(Array.isArray(cats) ? cats : (cats?.items ?? []));
    } catch (e) {
      setErr(e?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
    );
  }, [categories, search]);

  const onNew = () => {
    setEditing(null);
    setName(""); setDesc(""); setColor("#64748b"); setIcon("tag"); setType("expense"); setIsDefault(false);
    setOpen(true);
  };

  const onEdit = (cat) => {
    setEditing(cat);
    setName(cat?.name || "");
    setDesc(cat?.description || "");
    setColor(cat?.color || "#64748b");
    setIcon(cat?.icon || "tag");
    setType(cat?.type || "expense");
    setIsDefault(Boolean(cat?.is_default));
    setOpen(true);
  };

  const validate = () => {
    if (!name.trim()) return "Le nom est requis.";
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return "Couleur invalide (ex: #FF5733).";
    if (!TYPE_OPTIONS.includes(type)) return "Type invalide.";
    return null;
  };

  const onSave = async () => {
    const v = validate();
    if (v) { Alert.alert("Validation", v); return; }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      color,
      icon: icon.trim() || null,
      type,
      is_default: !!isDefault,
    };

    try {
      if (editing?.id) {
        await json(`/api/category/update/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type":"application/json", ...authHeaders },
          body: JSON.stringify(payload),
        });
      } else {
        await json(`/api/category/create`, {
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

  const onDelete = async (cat) => {
    const ok = Platform.OS === "web"
      ? window.confirm(`Supprimer la catégorie “${cat.name}” ?`)
      : await new Promise(res => {
          Alert.alert("Confirmer", `Supprimer la catégorie “${cat.name}” ?`, [
            { text:"Annuler", style:"cancel", onPress:() => res(false) },
            { text:"Supprimer", style:"destructive", onPress:() => res(true) },
          ]);
        });
    if (!ok) return;

    const prev = categories;
    setCategories(arr => arr.filter(c => c.id !== cat.id)); // optimiste
    try {
      await json(`/api/category/delete/${cat.id}`, { method:"DELETE", headers: { ...authHeaders } });
    } catch (e) {
      setCategories(prev); // rollback
      Alert.alert("Erreur", e?.message || "Suppression impossible");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: item.color || "#64748b" }]} />
      <View style={{ flex:1, minWidth:0 }}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.type} {item.is_default ? "· défaut" : ""} {item.icon ? `· ${item.icon}` : ""}
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

  return (
    <Layout header={<AppHeader />} footer={<AppFooter />} style={{ backgroundColor:"#000" }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Catégories (admin)</Text>
          <TouchableOpacity onPress={onNew} style={styles.newBtn}>
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.newBtnText}>Nouvelle</Text>
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
            <View style={styles.search}>
              <Ionicons name="search" size={18} color="#72CE1D" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une catégorie…"
                placeholderTextColor="#6b6b6b"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(it) => String(it.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={{ color:"#9aa0a6" }}>Aucune catégorie.</Text>}
            />
          </>
        )}

        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editing ? "Modifier la catégorie" : "Nouvelle catégorie"}</Text>
              <ScrollView contentContainerStyle={{ gap:10 }}>
                <Field label="Nom" value={name} onChangeText={setName} />
                <Field label="Description" value={description} onChangeText={setDesc} multiline />
                <Field label="Couleur (#RRGGBB)" value={color} onChangeText={setColor} autoCapitalize="none" />
                <Field label="Icône (texte libre)" value={icon} onChangeText={setIcon} />

                <Text style={styles.label}>Type</Text>
                <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8 }}>
                  {TYPE_OPTIONS.map(t => {
                    const active = type === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setType(t)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ flexDirection:"row", gap:8, marginTop:10 }}>
                  <TouchableOpacity onPress={() => setOpen(false)} style={[styles.btn, styles.btnGhost]}>
                    <Text style={styles.btnGhostText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onSave} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>{editing ? "Enregistrer" : "Créer"}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
      <TextInput style={styles.input} placeholderTextColor="#666" {...rest} />
    </View>
  );
}
