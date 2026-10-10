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