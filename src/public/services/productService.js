// public/services/productService.js

/**
 * Salva un nuovo prodotto associato al ristorante
 */
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
 * Recupera l'elenco dei prodotti inseriti da uno specifico ristorante
 */
export async function getRestaurantProducts(restaurantId) {
  const response = await fetch(`/api/products/restaurant/${encodeURIComponent(restaurantId)}`);

  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
}

/**
 * Rimuove un prodotto dal menù
 */
export async function deleteProduct(productId) {
  const response = await fetch(`/api/products/remove/${productId}`, {
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

function checkResponse(response, data) {

  if (!response.ok) {
    // 1. Errore di validazione (Mongoose): estrae il testo del primo errore trovato
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(data.errors[0].msg || data.errors[0].message);
    }

    // 2. Errore con campo message singolo (es. "Email già in uso")
    if (data?.message) {
      throw new Error(data.message);
    }

    // 3. Fallback generico pulito se non c'è un messaggio formattato
    throw new Error(error.message || "Si è verificato un errore durante la richiesta. Riprova più tardi.");
  }
  return data;
}