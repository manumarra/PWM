import { checkResponse } from "/services/http.js";

/**
 * Recupera l'elenco dei prodotti inseriti da uno specifico ristorante
 */
export async function getRestaurantProducts(restaurantId) {
  const response = await fetch(`/api/products/restaurant/${encodeURIComponent(restaurantId)}`);

  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
}

// Crea un nuovo prodotto associato al ristoratore
export async function createProduct(productData) {
  const response = await fetch("/api/products/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(productData)
  });

  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
}

/**
 * Rimuove un prodotto dal menù
 */
export async function deleteProduct(productId) {
  const response = await fetch(`/api/products/remove/${encodeURIComponent(productId)}`, {
    method: "DELETE"
  });

  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
}

export async function deleteAllProduct(restaurantId) {
  const response = await fetch(`/api/products/restaurant/${encodeURIComponent(restaurantId)}`, {
    method: "DELETE"
  });
  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
  
}

export async function updateProduct(productId, updates) {
  const response = await fetch(`/api/products/update/${encodeURIComponent(productId)}`, {
    method: "PUT",
    headers: {"Content-type": "application/json;charset=utf-8"},
    body: JSON.stringify(updates)
  });
  const data= await response.json().catch(()=> null);
  checkResponse(response,data);
  return data;
}