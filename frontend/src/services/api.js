// frontend/src/services/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ⚙️ Base API (dev local: Android emulator = 10.0.2.2, iOS sim = 127.0.0.1)
// Tu peux aussi surcharger via EXPO_PUBLIC_API_URL / VITE_API_URL
const DEFAULT_HOST = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.VITE_API_URL ||
  `http://${DEFAULT_HOST}:8000`;

const isAbsolute = (u) => /^https?:\/\//i.test(u);
const joinUrl = (base, path) => {
  if (!path) return base;
  if (isAbsolute(path)) return path; // déjà absolue -> on ne préfixe pas
  return `${base.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
};

async function authHeader() {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body, auth = false, headers = {} } = {}) {
  const url = joinUrl(API_URL, path);
  const baseHeaders =
    method === "GET" || method === "HEAD"
      ? { ...headers }
      : { "Content-Type": "application/json", ...headers };
  const withAuth = auth ? await authHeader() : {};

  const res = await fetch(url, {
    method,
    headers: { ...baseHeaders, ...withAuth },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    const msg = typeof data === "object" ? (data?.message || data?.error) : text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  get: (p, opts) => request(p, { ...opts, method: "GET" }),
  post: (p, body, opts) => request(p, { ...opts, method: "POST", body }),
  put: (p, body, opts) => request(p, { ...opts, method: "PUT", body }),
  patch: (p, body, opts) => request(p, { ...opts, method: "PATCH", body }),
  del: (p, opts) => request(p, { ...opts, method: "DELETE" }),
};

export { API_URL };
