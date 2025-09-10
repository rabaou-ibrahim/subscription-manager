import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export const storage = {
  get: async (key) => {
    try {
      return isWeb
        ? await AsyncStorage.getItem(key)
        : await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  set: async (key, value) => {
    try {
      return isWeb
        ? await AsyncStorage.setItem(key, value)
        : await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  del: async (key) => {
    try {
      return isWeb
        ? await AsyncStorage.removeItem(key)
        : await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};
