// src/services/http.js
export const API = process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
export const json = (path, opts={}) =>
  fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  }).then(r => r.json().catch(() => ({})).then(data => ({ ok: r.ok, status: r.status, data })));
