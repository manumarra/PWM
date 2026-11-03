import { checkResponse } from "/services/http.js";

const postJson = (url, body) => fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body ?? {})
});

// Stripe è attivo? (altrimenti i pagamenti sono simulati)
export async function getPaymentConfig() {
  const response = await fetch("/api/payments/config");
  const data = await response.json().catch(() => null);
  return checkResponse(response, data, { fallback: "Impossibile leggere la configurazione dei pagamenti" }).data;
}

// Chiede al server di verificare con Stripe il pagamento di una sessione
export async function confirmPayment(sessionId) {
  const response = await postJson("/api/payments/confirm", { sessionId });
  const data = await response.json().catch(() => null);
  return checkResponse(response, data, { fallback: "Impossibile verificare il pagamento" }).data;
}

// Nuova sessione di pagamento per un ordine in attesa: restituisce l'indirizzo della pagina Stripe
export async function resumePayment(orderId) {
  const response = await postJson(`/api/payments/checkout/${orderId}`);
  const data = await response.json().catch(() => null);
  return checkResponse(response, data, { fallback: "Impossibile riprendere il pagamento" }).checkoutUrl;
}