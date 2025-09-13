// src/services/invitations.js
import { json } from "./http";
const H = (t) => (t ? { Authorization: `Bearer ${t}` } : {});

export const listInvitesBySpace = (spaceId, token) =>
  json(`/api/invite/all?space_id=${encodeURIComponent(spaceId)}`, { headers: H(token) });

export const myInvites = (token) =>
  json("/api/invite/mine", { headers: H(token) });

export const acceptInvite = (id, token) =>
  json(`/api/invite/accept/${id}`, { method: "POST", headers: H(token) });

export const declineInvite = (id, token) =>
  json(`/api/invite/decline/${id}`, { method: "POST", headers: H(token) });
