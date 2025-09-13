// src/services/payments.js
import { json } from "./http"; // ton helper existant

const BASE = "/api/payment";

export async function createPayment({ subscriptionId, amount, currency = "EUR", paymentMethod = "credit_card", transactionId = null }, token) {
  return json(`${BASE}/create`, {
    method: "POST",
    token,
    body: {
      amount,
      currency,
      payment_method: paymentMethod,
      subscription_id: subscriptionId,
      transaction_id: transactionId, // nullable pour MVP
    },
  });
}

export async function updatePayment({ paymentId, status, transactionId = null }, token) {
  return json(`${BASE}/update/${paymentId}`, {
    method: "PUT",
    token,
    body: {
      status,
      ...(transactionId ? { transaction_id: transactionId } : {}),
    },
  });
}

export async function getPayment(paymentId, token) {
  return json(`${BASE}/${paymentId}`, { method: "GET", token });
}

// liste filtrée par subscription (MVP: on filtre côté front si tu n’as pas encore le query côté back)
export async function listPaymentsBySubscription(subscriptionId, token) {
  const res = await json(`${BASE}/all`, { method: "GET", token });
  return Array.isArray(res) ? res.filter(p => p.subscription_id === subscriptionId) : [];
}
