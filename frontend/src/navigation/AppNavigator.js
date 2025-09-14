// src/navigation/AppNavigator.js
import React, { useState, useEffect} from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAuth from "../hooks/useAuth";

// Écrans
import HomeScreen from "../screens/Home/HomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

import DashboardScreen from "../screens/dashboard/DashboardScreen";

import ActiveSubscriptionScreen from "../screens/subscriptions/ActiveSubscriptionScreen";
import AddSubscriptionScreen from "../screens/subscriptions/AddSubscriptionScreen";
import SubscriptionDetailsScreen from "../screens/subscriptions/SubscriptionDetailsScreen";
import SubscriptionItem from "../screens/subscriptions/SubscriptionItem";
import SubscriptionListScreen from "../screens/subscriptions/SubscriptionListScreen";

import SpacesScreen from "../screens/spaces/SpacesScreen";
import SpaceCreateScreen from "../screens/spaces/SpaceCreateScreen";
import SpaceDetailsScreen from "../screens/spaces/SpaceDetailsScreen";

import ProfileScreen from "../screens/profile/ProfileScreen";

import MyInvitationsScreen from "../screens/invitations/MyInvitationsScreen";

import NotificationsScreen from "../screens/notifications/NotificationsScreen";

import PaymentScreen from "../screens/payments/PaymentScreen";

import ServicesAdminScreen from "../screens/admin/ServicesAdminScreen";
import CategoriesAdminScreen from "../screens/admin/CategoriesAdminScreen";

// Placeholders
const makePlaceholder = (title) => () => (
  <View style={{ flex:1, backgroundColor:"#000", alignItems:"center", justifyContent:"center" }}>
    <Text style={{ color:"#fff", fontSize:18, fontWeight:"700" }}>{title}</Text>
  </View>
);

const Stack = createNativeStackNavigator();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "transparent" } };

const PERSISTENCE_KEY = "NAVIGATION_STATE";

export default function AppNavigator() {
  const { ready, isLogged } = useAuth();
  const [navState, setNavState] = useState();
  const [isNavReady, setIsNavReady] = useState(false);

  useEffect(() => {
    const restoreState = async () => {
      try {
        const state = await AsyncStorage.getItem(PERSISTENCE_KEY);
        if (state) setNavState(JSON.parse(state));
      } finally {
        setIsNavReady(true);
      }
    };
    restoreState();
  }, []);

  if (!ready || !isNavReady) {
    return (
      <View style={{ flex:1, backgroundColor:"#000", alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={theme}
      initialState={navState}
      onStateChange={state => AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))}
    >
      {isLogged ? (
        <Stack.Navigator screenOptions={{ headerShown:false, animation:"fade" }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Mon Profil" }} />
          <Stack.Screen name="ActiveSubscription" component={ActiveSubscriptionScreen} options={{ title: "Mon Abonnement Actif" }} />
          <Stack.Screen name="SubscriptionList" component={SubscriptionListScreen} options={{ title: "Mes Abonnements" }} />
          <Stack.Screen name="SubscriptionDetails" component={SubscriptionDetailsScreen} options={{ title: "Détails de l'Abonnement" }} />
          <Stack.Screen name="SubscriptionItem" component={SubscriptionItem} />
          <Stack.Screen name="SpaceCreate" component={SpaceCreateScreen} options={{ title: "Créer un Espace" }} />
          <Stack.Screen name="SpaceDetails" component={SpaceDetailsScreen} options={{ title: "Détails de l'Espace" }} />
          <Stack.Screen name="SpacesScreen" component={SpacesScreen} options={{ title: "Mes Espaces" }} />
          <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} options={{ title: "Ajouter un Abonnement" }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
          <Stack.Screen name="CategoriesAdmin" component={CategoriesAdminScreen} options={{ title: "Catégories (admin)" }} />
          <Stack.Screen name="ServicesAdmin" component={ServicesAdminScreen} options={{ title: "Services (admin)" }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: "Paiement" }} />
          <Stack.Screen name="MyInvitations" component={MyInvitationsScreen} options={{ title: "Mes invitations" }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown:false, animation:"fade" }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Se connecter" }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "S'inscrire" }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
