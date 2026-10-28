import { checkResponse } from "/services/http.js";

//Recupera i piatti comuni paginati dal catalogo con eventuali filtri
export async function getMeals({ page = 1, limit = 12, category = "", search = "" } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (category) params.append("category", category);
    if (search) params.append("search", search);

    const response = await fetch(`/api/meals/catalog?${params.toString()}`);
    
    const data = await response.json().catch(() => null);
    checkResponse(response, data);
    return data;
}

// Recupera il singolo piatto comune per visualizzarne i dettagli
export async function getMealById(id) {
  const response = await fetch(`/api/meals/detail/${encodeURIComponent(id)}`);
  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
}