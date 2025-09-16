// src/services/http.js
const BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function extractMessage(status, data) {
  if (data && Array.isArray(data.violations) && data.violations.length) {
    return data.violations
      .map(v => v.message || (v.propertyPath ? `${v.propertyPath}: ${v.message}` : ""))
      .filter(Boolean)
      .join("\n");
  }
  
  if (data && typeof data === "object") {
    if (data.message) return data.message;
    if (data.error)   return data.error;
    if (data.detail)  return data.detail;
    if (Array.isArray(data.errors)) return data.errors.join("\n");
    if (data.title && data.status) return `${data.title} (HTTP ${data.status})`;
  }
  if (typeof data === "string" && data.trim()) return data.trim();
  return `HTTP ${status}`;
}

export async function json(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;

  const { headers: extraHeaders = {}, body, ...rest } = opts;
  const method = (rest.method || "GET").toUpperCase();

  const init = {
    method,
    headers: {
      Accept: "application/json",
      ...((method !== "GET" && method !== "HEAD") ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders,
    },
    ...((method !== "GET" && method !== "HEAD" && body != null)
      ? { body: typeof body === "string" ? body : JSON.stringify(body) }
      : {}),
    ...rest,
  };

  const res = await fetch(url, init);
  const content = res.headers.get("content-type") || "";
  const isJson = content.includes("application/json");
  let data = null;
  try { data = isJson ? await res.json() : await res.text(); } catch {}

  if (!res.ok) {
    const msg = extractMessage(res.status, data) || `${method} ${url} - ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
