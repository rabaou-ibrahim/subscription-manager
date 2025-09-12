import { StyleSheet } from "react-native";

const GREEN = "#B7FF27";

export default StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 12 },
  card: {
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#1f1f1f",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
  width: 56, height: 56, borderRadius: 28,
  backgroundColor: "#141414",
  borderWidth: 1, borderColor: "#343434",
  alignItems: "center", justifyContent: "center",
  overflow: "hidden", // important pour l’image
  },
  avatarImg: {
    width: "100%", height: "100%", borderRadius: 28,
  },
  avatarText: { color: "#B7FF27", fontWeight: "800", fontSize: 20 },
  nameLine: { color: "#fff", fontWeight: "800" },
  muted: { color: "#9aa0a6" },
  sectionTitle: { color: "#fff", fontWeight: "800", marginBottom: 6 },
  error: { color: "#ff6b6b", marginTop: 4 },
  success: { color: "#72CE1D", marginTop: 4 },

  // Buttons
  btn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1,
  },
  btnPrimary:   { backgroundColor: GREEN, borderColor: GREEN },
  btnPrimaryText: { color: "#000", fontWeight: "800" },
  btnDanger:    { backgroundColor: "#C62828", borderColor: "#C62828" },
  btnDangerText:{ color: "#fff", fontWeight: "800" },
  btnGhost:     { backgroundColor: "transparent", borderColor: "#2a2a2a" },
  btnGhostText: { color: GREEN, fontWeight: "700" },
  btnDisabled:  { opacity: 0.6 },
});
