// src/services/spaces.js
import { json } from "./http";

const BASE = "/api/space";

const auth = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export function listSpaces(token) {
  return json(`${BASE}/all`, { headers: auth(token) });
}

export function createSpace({ name, visibility, description = null, logo = "default.png" }, token) {
  return json(`${BASE}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth(token) },
    body: JSON.stringify({ name, visibility, description, logo }),
  });
}

export function getSpace(id, token) {
  return json(`${BASE}/${id}`, { headers: auth(token) });
}

export function archiveSpace(id, token) {
  return json(`${BASE}/archive/${id}`, { method: "PATCH", headers: auth(token) });
}

export function deleteSpace(id, token) {
  return json(`${BASE}/delete/${id}`, { method: "DELETE", headers: auth(token) });
}
