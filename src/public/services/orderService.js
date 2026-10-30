import { checkResponse } from "/services/http.js";

export async function createOrder(orderPayload) {
  const response = await fetch("/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload)
  });
  const data = await response.json().catch(() => null);
  return checkResponse(response, data, { fallback: "Errore nella creazione dell'ordine" });
}

export async function getQuote(payload) {
  const response = await fetch("/api/orders/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);
  return checkResponse(response, data, { fallback: "Impossibile calcolare il preventivo" });
}

export async function getOrdersByCustomer(customerId, page = 1, limit = 12) {
  const response = await fetch(`/api/orders/customer/${customerId}?page=${page}&limit=${limit}`, {
    method: "GET"
  });
  const data = await response.json().catch(() => null);
  return checkResponse(response, data, { fallback: "Errore nel recupero degli ordini" }); // { status, data, pagination }
}

export async function getOrdersByRestaurant(restaurantId) {
  const response = await fetch(`/api/orders/restaurant/${restaurantId}`, {
    method: "GET"
  });
  const data = await response.json().catch(() => null);
  return checkResponse(response, data, { fallback: "Errore nel recupero degli ordini" });
}

export async function updateOrderStatus(orderId, status, verificationCode = null) {
  const payload = { status };
  if (verificationCode) payload.verificationCode = verificationCode;

  const response = await fetch(`/api/orders/update-status/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);
  return checkResponse(response, data, { fallback: "Errore nell'aggiornamento dello stato" });
}

export async function getRestaurantOrderHistory(restaurantId, page = 1, limit = 12) {
  const response = await fetch(`/api/orders/restaurant/${restaurantId}/history?page=${page}&limit=${limit}`, {
    method: "GET"
  });
  const data = await response.json().catch(() => null);
  return checkResponse(response, data, { fallback: "Errore nel recupero dello storico ordini" });
}

export async function getRestaurantStats(restaurantId, days = 30) {
  const response = await fetch(`/api/orders/restaurant/${restaurantId}/stats?days=${days}`, {
    method: "GET"
  });
  const data = await response.json().catch(() => null);
  return checkResponse(response, data, { fallback: "Errore nel recupero delle statistiche" });
}