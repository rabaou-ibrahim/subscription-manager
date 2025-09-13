// src/styles/CategoriesAdminStyles.js
import { StyleSheet, Platform } from "react-native";

export default StyleSheet.create({
  container: { flex:1, backgroundColor:"#000", padding:16 },
  center: { flex:1, alignItems:"center", justifyContent:"center" },

  headerRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:12 },
  pageTitle: { color:"#fff", fontSize:18, fontWeight:"800" },
  newBtn: { flexDirection:"row", alignItems:"center", gap:6, backgroundColor:"#A6FF00", borderRadius:12, paddingVertical:10, paddingHorizontal:12 },
  newBtnText: { color:"#000", fontWeight:"800" },

  search: {
    flexDirection:"row", alignItems:"center", gap:8,
    backgroundColor:"#101010", borderWidth:1, borderColor:"#1f1f1f",
    paddingHorizontal:10, paddingVertical:10, borderRadius:10, marginBottom:10,
  },
  searchInput: { flex:1, color:"#fff" },

  list: { paddingBottom:24, gap:10 },

  row: {
    flexDirection:"row", alignItems:"center",
    backgroundColor:"#131313", borderRadius:12,
    paddingHorizontal:12, paddingVertical:12,
    borderWidth:1, borderColor:"#1f1f1f",
  },
  dot: { width:14, height:14, borderRadius:7, marginRight:10 },
  title: { color:"#fff", fontSize:16, fontWeight:"700" },
  subtitle: { color:"#9aa0a6", fontSize:12, marginTop:2 },

  iconBtn: { paddingHorizontal:8, paddingVertical:6, marginLeft:4 },

  modalBackdrop: { flex:1, backgroundColor:"rgba(0,0,0,0.6)", justifyContent:"center", padding:16 },
  modalCard: { backgroundColor:"#0f0f0f", borderRadius:14, borderWidth:1, borderColor:"#1f1f1f", padding:14, maxHeight:"85%" },
  modalTitle: { color:"#fff", fontWeight:"800", fontSize:16, marginBottom:10 },

  label: { color:"#9aa0a6", marginBottom:6 },
  input: { backgroundColor:"#121212", borderWidth:1, borderColor:"#1f1f1f", borderRadius:10, paddingHorizontal:12, paddingVertical:10, color:"#fff" },

  chip: {
    paddingHorizontal:12, paddingVertical:8, borderRadius:999,
    borderWidth:1, borderColor:"#2a2a2a", backgroundColor:"#151515",
  },
  chipActive: { backgroundColor:"#A6FF00", borderColor:"#A6FF00" },
  chipText: { color:"#ddd", fontWeight:"700" },
  chipTextActive: { color:"#000", fontWeight:"800" },

  btn: {
    flex:1, alignItems:"center", justifyContent:"center",
    paddingVertical:12, borderRadius:10, borderWidth:1, gap:6,
    ...(Platform.OS === "web" ? { cursor:"pointer" } : null),
  },
  btnPrimary: { backgroundColor:"#A6FF00", borderColor:"#A6FF00" },
  btnPrimaryText: { color:"#000", fontWeight:"800" },
  btnGhost: { backgroundColor:"transparent", borderColor:"#2a2a2a" },
  btnGhostText: { color:"#A6FF00", fontWeight:"800" },
});
