// src/services/auth.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { json } from "./http";

const LOGIN = "/api/auth/login";
const REGISTER = "/api/user/create";
const ME = "/api/user/me";

export async function login(email, password) {
  const data = await json(LOGIN, {
    method: "POST",
    body: { email, password },
  });
  const token = data?.token || data?.jwt || data?.id_token;
  if (!token) throw new Error("Token manquant dans la réponse");
  await AsyncStorage.setItem("token", token);
  return token;
}

export async function register(payload) {
  // payload: { firstname, lastname, email, password, ...optionnels }
  return json(REGISTER, {
    method: "POST",
    body: {
      firstname: payload.firstname,
      lastname:  payload.lastname,
      email:     payload.email,
      password:  payload.password,
      username:  payload.username ?? null,
      phone_number: payload.phone_number ?? null,
      age: payload.age ?? null,
      avatar: payload.avatar ?? null,
    },
  });
}

export async function me() {
  return json(ME, { auth: true });
}

export async function logout() {
  await AsyncStorage.removeItem("token");
}
