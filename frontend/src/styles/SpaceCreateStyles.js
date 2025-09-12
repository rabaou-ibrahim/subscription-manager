import { StyleSheet } from "react-native";

const GREEN = "#B7FF27";
const BORDER = "#262626";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { color: "#fff", fontWeight: "800", fontSize: 20 },
  badge: { backgroundColor: "rgba(183,255,39,0.14)", borderWidth: 1, borderColor: GREEN, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: GREEN, fontWeight: "800", fontSize: 12, letterSpacing: 0.4 },

  label: { color: GREEN, fontSize: 13, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    color: "#eee",
    borderWidth: 1,
    borderColor: BORDER,
  },

  avatarRow: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 6 },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#111", borderWidth: 1, borderColor: BORDER,
    alignItems: "center", justifyContent: "center",
  },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  btn: {
    flex: 1, height: 48, borderRadius: 12, paddingHorizontal: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1,
  },
  btnPrimary: { backgroundColor: GREEN, borderColor: GREEN },
  btnSecondary: { backgroundColor: "#181818", borderColor: BORDER },
  btnDanger: { backgroundColor: "#C62828", borderColor: "#C62828", marginTop: 8 },

  btnText: { color: "#fff", fontWeight: "800" },
  btnTextDark: { color: "#000", fontWeight: "800" },
  btnDisabled: { opacity: 0.6 },
  btnTextDisabled: { opacity: 0.8 },

  error: { color: "#ff6b6b", marginTop: 4, marginBottom: 8 },
  success: { color: "#72CE1D", marginTop: 4, marginBottom: 8 },
});
