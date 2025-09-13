// src/services/members.js
import { json } from "./http";
const H = (t) => (t ? { Authorization: `Bearer ${t}` } : {});

export const createMember = (payload, token) =>
  json("/api/member/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...H(token) },
    body: JSON.stringify(payload),
  });

export const listMembersBySpace = (spaceId, token) =>
  json(`/api/member/all?space_id=${encodeURIComponent(spaceId)}`, {
    headers: H(token),
  });

export const cancelInvite = (id, token) =>
  json(`/api/member/invitation/cancel/${id}`, { method: "POST", headers: H(token) });

export const resendInvite = (id, token) =>
  json(`/api/member/invitation/resend/${id}`, { method: "POST", headers: H(token) });
