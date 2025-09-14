// src/services/invitations.js
import { json } from "./http";

const H = (t, extra = {}) => (t ? { Authorization: `Bearer ${t}`, ...extra } : extra);
const normalize = (data) => (Array.isArray(data) ? data : data?.items ?? []);

/** Invitations d'un espace (essaie /member/invitations puis fallback /invite/all) */
export async function listInvitesBySpace(spaceId, token, { signal } = {}) {
  const qs = `space_id=${encodeURIComponent(spaceId)}`;
  try {
    const r = await json(`/api/member/invitations?${qs}`, { headers: H(token), signal });
    return normalize(r);
  } catch {
    const r = await json(`/api/invite/all?${qs}`, { headers: H(token), signal });
    return normalize(r);
  }
}

/** Mes invitations (ciblées sur mon email) */
export async function myInvites(token, { signal } = {}) {
  const r = await json("/api/invite/mine", { headers: H(token), signal });
  return normalize(r);
}

/** Accepter une invitation */
export function acceptInvite(id, token, { signal } = {}) {
  return json(`/api/invite/accept/${id}`, { method: "POST", headers: H(token), signal });
}

/** Refuser une invitation (POST par défaut, DELETE possible) */
export function declineInvite(id, token, { signal, method = "POST" } = {}) {
  return json(`/api/invite/decline/${id}`, { method, headers: H(token), signal });
}
