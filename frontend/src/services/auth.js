// frontend/src/services/auth.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

// ✳️ Routes conformes à ton backend:
const LOGIN = "/api/auth/login";
const REGISTER = "/api/user/create";
const ME = "/api/user/me";

export async function login(email, password) {
  const data = await api.post(LOGIN, { email, password });
  const token = data?.token || data?.jwt || data?.id_token;
  if (!token) throw new Error("Token manquant dans la réponse");
  await AsyncStorage.setItem("token", token);
  return token;
}

export async function register({ firstname, lastname, email, password }) {
  // /api/user/create
  return api.post(REGISTER, { firstname, lastname, email, password });
}

export async function me() {
  return api.get(ME, { auth: true });
}

export async function logout() {
  await AsyncStorage.removeItem("token");
}
