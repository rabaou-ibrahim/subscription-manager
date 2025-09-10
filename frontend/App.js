// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import HomeScreen from "./src/screens/Home/HomeScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* placeholders pour éviter les erreurs de navigate() */}
        <Stack.Screen name="Dashboard" component={() => null} />
        <Stack.Screen name="SubscriptionList" component={() => null} />
        <Stack.Screen name="SpacesScreen" component={() => null} />
        <Stack.Screen name="AddSubscription" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
