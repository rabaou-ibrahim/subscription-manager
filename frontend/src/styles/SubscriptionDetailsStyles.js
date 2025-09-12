import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0E0E0E",
        padding: 16,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#72CE1D",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        flex: 1,
        color: "#fff",
        fontSize: 20,
        fontWeight: "800",
        textAlign: "center",
    },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        marginTop: 8,
        marginBottom: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    card: {
        backgroundColor: "#161616",
        borderRadius: 14,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#2A2A2A",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 6,
    },
    rowLabel: {
        color: "#aaa",
        marginLeft: 8,
        width: 120,
    },
    rowValue: {
        color: "#fff",
        marginLeft: "auto",
        fontWeight: "700",
    },
    divider: {
        height: 1,
        backgroundColor: "#242424",
        marginVertical: 8,
    },
    sectionTitle: {
        color: "#fff",
        fontWeight: "800",
        marginBottom: 8,
    },
    notes: {
        color: "#ddd",
        marginBottom: 8,
    },
    kv: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    k: {
        color: "#9aa0a6",
    },
    v: {
        color: "#fff",
        fontWeight: "600",
    },
    actionsRow: {
        flexDirection: "row",
        marginTop: 16,
        gap: 10,
    },
    secondaryBtn: {
        flex: 1,
        backgroundColor: "#72CE1D",
        padding: 12,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    secondaryBtnText: {
        color: "#000",
        fontWeight: "700",
    },
    dangerBtn: {
        flex: 1,
        backgroundColor: "#C62828",
        padding: 12,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    dangerBtnText: {
        color: "#fff",
        fontWeight: "700",
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0E0E0E",
    },
    muted: {
        color: "#9aa0a6",
    },
    backBtn: {
        marginTop: 12,
        backgroundColor: "#72CE1D",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    backBtnText: {
        color: "#000",
        fontWeight: "700",
    },
});