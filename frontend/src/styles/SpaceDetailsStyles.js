import { StyleSheet, Platform } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  desc: {
    color: "#aaa",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151515",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#A6FF00",
    fontWeight: "bold",
  },
  memberName: {
    color: "#fff",
    fontWeight: "600",
  },
  memberSub: {
    color: "#aaa",
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#222",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  dangerBtn: {
    backgroundColor: "#2a0000",
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  dangerText: {
    color: "#ff6b6b",
    fontWeight: "700",
  },
  cta: {
    backgroundColor: "#A6FF00",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  ctaText: {
    fontWeight: "bold",
  },
  muted: {
    color: "#999",
  },
  error: {
    color: "#ff6b6b",
  },
    memberCard: {
    backgroundColor: "#0F1115",
    borderColor: "#2C2F36",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  memberName: { color: "#EAEAEA", fontWeight: "700" },
  memberMeta: { color: "#A0A0A0", fontSize: 12 },
  inviteCard: {
    backgroundColor: "#0B0D11",
    borderColor: "#263041",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addCard: {
    backgroundColor: "#161616",
    borderColor: "#2A2A2A",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 12,
    zIndex: 5,
  },
  input: {
    backgroundColor: "#0f0f0f",
    borderColor: "#2A2A2A",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: "#fff",
  },
  inputHint: { color: "#6b6b6b", fontSize: 12, marginTop: 6 },
  // chips
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "#3a3a3a", backgroundColor: "#1b1b1b" },
  chipActive: { backgroundColor: "#72CE1D", borderColor: "#72CE1D" },
  chipText: { color: "#ddd", fontWeight: "700" },
  chipTextActive: { color: "#000", fontWeight: "800" },
  // suggestions overlay
  suggestList: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#101114', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, zIndex: 20, maxHeight: 220, overflow: 'hidden' },
  suggestItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: 'transparent' },
  addCta: {
    marginTop: 16,
    backgroundColor: "#111",          // fond plus clair que #0f0f0f
    borderColor: "#2A2A2A",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    // léger glow vert
    shadowColor: "#72CE1D",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  addCtaPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "#151515",
  },
  addCtaIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#72CE1D",
    alignItems: "center", justifyContent: "center",
  },
  addCtaText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.3,
  },

  // Si tu utilises la liste de suggestions, assure qu’elle passe AU-DESSUS
  suggestList: {
    position: "absolute",
    top: 54, left: 0, right: 0,
    backgroundColor: "#0f0f0f",
    borderColor: "#2A2A2A",
    borderWidth: 1,
    borderRadius: 10,
    maxHeight: 220,
    overflow: "hidden",
    zIndex: 9999,                 // important sur web
  },
  suggestItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  // (facultatif) des chips plus lisibles si tu veux
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#1f1f1f",
    borderWidth: 1,
    borderColor: "#333",
  },
  chipActive: {
    backgroundColor: "#72CE1D",
    borderColor: "#72CE1D",
  },
  chipText: { color: "#ddd", fontWeight: "700" },
  chipTextActive: { color: "#000", fontWeight: "800" },

  // (facultatif) un input un poil plus contrasté
  input: {
    backgroundColor: "#101010",
    borderColor: "#2A2A2A",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: "#fff",
  },
  // === Boutons unifiés ===
  btn: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    gap: 6,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
  },

  // Primary (Valider)
  btnPrimary: {
    backgroundColor: "#72CE1D",
    borderColor: "#72CE1D",
  },
  btnPrimaryText: {
    color: "#000",
    fontWeight: "800",
  },

  // Danger (Annuler)
  btnDanger: {
    backgroundColor: "#C62828",
    borderColor: "#C62828",
  },
  btnDangerText: {
    color: "#fff",
    fontWeight: "800",
  },

  // Etats
  btnDisabled: {
    backgroundColor: "#1b1b1b",
    borderColor: "#2A2A2A",
  },
  btnTextDisabled: {
    color: "#888",
    fontWeight: "700",
  },

  // (si pas déjà défini)
  addCard: {
    backgroundColor: "#161616",
    borderColor: "#2A2A2A",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
});
