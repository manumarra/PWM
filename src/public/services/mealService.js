//Recupera i piatti comuni paginati dal catalogo con eventuali filtri
 
export async function getMeals({ page = 1, limit = 12, category = "", search = "" } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (category) params.append("category", category);
    if (search) params.append("search", search);

    const response = await fetch(`/api/meals/catalog?${params.toString()}`);
    if (!response.ok) {
        throw new Error("Errore durante il recupero dei piatti dal catalogo");
    }
    return await response.json();
}

//Recupera i prodotti già inseriti nel menù di un determinato ristoratore
 
export async function getRestaurantProducts(restaurantId) {
  const response = await fetch(`/api/products?restaurantId=${encodeURIComponent(restaurantId)}`);
  if (!response.ok) {
    throw new Error("Errore durante il caricamento del menù del ristorante");
  }
  return await response.json();
}

//Salva un nuovo piatto nel menù del ristorante (creazione Product)

export async function createProduct(productData) {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Errore durante l'aggiunta del piatto al menù");
  }
  return await response.json();
}