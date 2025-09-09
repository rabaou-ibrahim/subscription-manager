// frontend/src/services/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://127.0.0.1:8000"; // adapte si besoin

async function authHeader() {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body, auth = false, headers = {} } = {}) {
  const baseHeaders = { "Content-Type": "application/json", ...headers };
  const withAuth = auth ? { ...(await authHeader()) } : {};
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { ...baseHeaders, ...withAuth },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Essaye de parser JSON, sinon renvoie texte
  let data = null;
  try { data = await res.json(); } catch { data = await res.text(); }

  if (!res.ok) {
    const msg = typeof data === "object" ? (data?.message || data?.error) : String(data);
    throw new Error(msg || `HTTP ${res.status}`);
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
