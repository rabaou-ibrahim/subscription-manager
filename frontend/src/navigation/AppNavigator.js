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

import NotificationsScreen from "../screens/notifications/NotificationsScreen";

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
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ActiveSubscription" component={ActiveSubscriptionScreen} />
          <Stack.Screen name="SubscriptionList" component={SubscriptionListScreen} />
          <Stack.Screen name="SubscriptionDetails" component={SubscriptionDetailsScreen} />
          <Stack.Screen name="SubscriptionItem" component={SubscriptionItem} />
          <Stack.Screen name="SpaceCreate" component={SpaceCreateScreen} />
          <Stack.Screen name="SpaceDetails" component={SpaceDetailsScreen} />
          <Stack.Screen name="SpacesScreen" component={SpacesScreen} />
          <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />

        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown:false, animation:"fade" }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
