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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Errore durante la creazione del prodotto");
  }

  return await response.json();
}

/**
 * Recupera l'elenco dei prodotti inseriti da uno specifico ristorante
 */
export async function getRestaurantProducts(restaurantId) {
  const response = await fetch(`/api/products/restaurant/${encodeURIComponent(restaurantId)}`);

  if (!response.ok) {
    throw new Error("Errore durante il recupero del menù");
  }

  return await response.json();
}

/**
 * Rimuove un prodotto dal menù
 */
export async function deleteProduct(productId) {
  const response = await fetch(`/api/products/remove/${productId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Errore durante la rimozione del prodotto");
  }

  return await response.json();
}