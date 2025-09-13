import React from "react";
import { View, Text } from "react-native";
import useAuth from "../hooks/useAuth";

export default function RoleBadge({ style }) {
  const { roles } = useAuth();
  const isAdmin = Array.isArray(roles) && roles.includes("ROLE_ADMIN");
  return (
    <View style={[{
      paddingHorizontal:10, paddingVertical:6,
      borderRadius:999, backgroundColor: isAdmin ? "#B7FF27" : "#1f1f1f",
      borderWidth:1, borderColor: isAdmin ? "#B7FF27" : "#2a2a2a",
    }, style]}>
      <Text style={{ color: isAdmin ? "#000" : "#ddd", fontWeight:"800", fontSize:12 }}>
        {isAdmin ? "ADMIN" : "USER"}
      </Text>
    </View>
  );
}
