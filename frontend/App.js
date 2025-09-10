// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/Home/HomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator();

function Placeholder() { return null; }
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={theme}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          {/* placeholders */}
          <Stack.Screen name="Dashboard" component={Placeholder} />
          <Stack.Screen name="SubscriptionList" component={Placeholder} />
          <Stack.Screen name="SpacesScreen" component={Placeholder} />
          <Stack.Screen name="AddSubscription" component={Placeholder} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
