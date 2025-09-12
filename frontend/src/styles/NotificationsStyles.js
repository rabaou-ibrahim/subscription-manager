// src/styles/NotificationsStyles.js
import { StyleSheet } from "react-native";

const GREEN = "#B7FF27";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 14, paddingTop: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  item: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  itemRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  iconWrap: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center",
  },
  title: { color: "#fff", fontWeight: "700" },
  body: { color: "#9aa0a6", marginTop: 4 },
  metaRow: { flexDirection: "row", gap: 10, marginTop: 8, alignItems: "center" },
  badgeUnread: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: "rgba(183,255,39,0.12)", borderWidth: 1, borderColor: GREEN,
  },
  badgeUnreadText: { color: GREEN, fontWeight: "800", fontSize: 12 },

  actionsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  btnGhost: { borderColor: "#2a2a2a" },
  btnGhostText: { color: "#ddd", fontWeight: "700" },
  btnDanger: { borderColor: "#C62828", backgroundColor: "#2a0000" },
  btnDangerText: { color: "#fff", fontWeight: "800" },

  search: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0f0f0f", borderRadius: 12, borderWidth: 1, borderColor: "#1f1f1f",
    paddingHorizontal: 10, marginBottom: 12,
  },
  searchInput: { flex: 1, color: "#eee", paddingVertical: 10 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#9aa0a6", marginTop: 8 },
});
