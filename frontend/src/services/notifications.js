// src/services/notifications.js
import { json } from "./http";

export async function listNotifications(headers = {}) {
  const data = await json("/api/notification/all", { headers });
  return Array.isArray(data) ? data : (data?.items ?? []);
}

export async function markNotificationRead(id, headers = {}) {
  return json(`/api/notification/mark-read/${id}`, {
    method: "PATCH",
    headers,
  });
}

export async function deleteNotification(id, headers = {}) {
  return json(`/api/notification/delete/${id}`, {
    method: "DELETE",
    headers,
  });
}
