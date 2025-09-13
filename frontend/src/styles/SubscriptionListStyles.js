import { StyleSheet } from "react-native";

const SubscriptionListStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },

  // centre le contenu à l'intérieur du ScrollView/Zone
  contentContainer: {
    alignItems: "center",
    paddingBottom: 16,
  },

  // wrapper centré avec largeur max
  content: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C8B6E2",
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: "#1A1A1A",
  },
  searchInput: { flex: 1, color: "#72CE1D", paddingVertical: 10 },
  searchButton: { padding: 5 },

  // Custom Subscription link
  customSubscriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C8B6E2",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    justifyContent: "space-between",
    backgroundColor: "#1A1A1A",
  },
  customSubscriptionText: {
    color: "#72CE1D",
    fontSize: 16,
    fontWeight: "600",
  },

  // List
  listContentContainer: {
    padding: 12,
    paddingBottom: 20,
    gap: 10,
  },

  // Card / row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#151515",
    borderRadius: 12,
  },
  leftIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f1f1f",
    marginRight: 12,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "600" },
  subtitle: { color: "#9aa0a6", marginTop: 2, fontSize: 13 },

  // right-side action button
  iconBtn: { paddingHorizontal: 8, paddingVertical: 6, marginRight: 6 },
});

export default SubscriptionListStyles;
