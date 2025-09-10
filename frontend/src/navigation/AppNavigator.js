// src/navigation/AppNavigator.js
import React from "react";
import { View, Text } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// 👉 Tes écrans déjà codés
import HomeScreen from "../screens/Home/HomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// Petits placeholders pour les routes déjà appelées par navigate()
// (remplace-les par tes vrais écrans quand tu les auras)
const makePlaceholder = (title) => () => (
  <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>{title}</Text>
  </View>
);
const Dashboard = makePlaceholder("Dashboard");
const SubscriptionList = makePlaceholder("SubscriptionList");
const SpacesScreen = makePlaceholder("SpacesScreen");
const AddSubscription = makePlaceholder("AddSubscription");

const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent", // on laisse nos écrans gérer le fond noir
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,   // on utilise nos AppHeader/AppFooter
          animation: "fade",
        }}
      >
        {/* Public */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* Placeholder routes (évite les erreurs de navigate) */}
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="SubscriptionList" component={SubscriptionList} />
        <Stack.Screen name="SpacesScreen" component={SpacesScreen} />
        <Stack.Screen name="AddSubscription" component={AddSubscription} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
