const API = "http://127.0.0.1:8000"; // adapte si besoin (10.0.2.2 sur Android émulateur)

export async function json(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  let data = null;
  try { data = isJson ? await res.json() : await res.text(); } catch {}

  if (!res.ok) {
    const msg =
      (typeof data === "object" && (data?.message || data?.error)) ||
      (typeof data === "string" ? data : null) ||
      `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
