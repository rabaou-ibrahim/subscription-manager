import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    },

    activeTab: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 8,    // <—
    },
    inactiveTab: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 8,    // <—
    },

    activeTabText: { 
        fontWeight: 'bold', color: '#000' 
    },
    inactiveTabText: { 
        color: '#aaa' 
    },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A6FF00",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  newBtnText: {
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#151515",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: "#A6FF00",
    fontWeight: "bold",
    fontSize: 16,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cardSub: {
    color: "#aaa",
    marginTop: 2,
    fontSize: 12,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  muted: {
    color: "#999",
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
  error: {
    color: "#ff6b6b",
    marginBottom: 8,
  },
});
