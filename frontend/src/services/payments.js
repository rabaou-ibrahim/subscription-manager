// src/services/payments.js
import { json } from "./http";

const H = (token) =>
  token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

const BASE = "/api/payment";
export const METHODS = {
  credit_card: "credit_card",
  paypal: "paypal",
  bank_transfer: "bank_transfer",
};

// -- bas niveau (endpoints existants) --
export async function createPayment(
  { subscriptionId, amount, currency = "EUR", paymentMethod, transactionId = null },
  token
) {
  return json(`${BASE}/create`, {
    method: "POST",
    headers: H(token),
    body: JSON.stringify({
      amount,
      currency,
      payment_method: paymentMethod,
      subscription_id: subscriptionId,
      transaction_id: transactionId, // nullable
    }),
  });
}

export async function completePayment(paymentId, { status = "completed", transactionId = null }, token) {
  return json(`${BASE}/update/${paymentId}`, {
    method: "PUT",
    headers: H(token),
    body: JSON.stringify({
      status,
      ...(transactionId ? { transaction_id: transactionId } : {}),
    }),
  });
}

export async function getPayment(paymentId, token) {
  return json(`${BASE}/${paymentId}`, { method: "GET", headers: H(token) });
}

export async function listPaymentsBySubscription(subscriptionId, token) {
  // Le back sait déjà filtrer via ?subscriptionId=
  return json(`${BASE}/all?subscriptionId=${encodeURIComponent(subscriptionId)}`, {
    method: "GET",
    headers: H(token),
  });
}

// -- haut niveau (logique métier MVP) --
export async function pay({ subscriptionId, amount, currency = "EUR", method, transactionId }, token) {
  // 1) créer en pending
  const created = await createPayment(
    { subscriptionId, amount, currency, paymentMethod: method, transactionId: transactionId ?? null },
    token
  );
  const paymentId = created?.payment?.id || created?.id;
  if (!paymentId) throw new Error("Création du paiement impossible.");

  // 2) virement = on laisse pending (validation manuelle)
  if (method === METHODS.bank_transfer) {
    return { paymentId, status: "pending" };
  }

  // 3) sinon, confirmer de suite
  await completePayment(paymentId, { status: "completed", transactionId: transactionId ?? undefined }, token);
  return { paymentId, status: "completed" };
}
