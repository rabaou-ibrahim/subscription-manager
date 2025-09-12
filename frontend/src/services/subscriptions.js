// src/services/subscriptions.js
import { json } from "../services/http";

export const listSubscriptions = async (scope = "mine", headers = {}) =>
  json(`/api/subscription/${scope === "all" ? "all" : "mine"}`, { headers });

export const deleteSubscription = (id, headers = {}) =>
  json(`/api/subscription/delete/${id}`, { method: "DELETE", headers });
