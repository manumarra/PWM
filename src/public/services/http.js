import { clearStoredUser } from "/utils/common/session.js";

const DEFAULT_MESSAGE = "Si è verificato un errore durante la richiesta. Riprova più tardi.";

/**
 * Controlla la risposta del server e lancia un Error con un messaggio leggibile.
 * - 401: sessione scaduta o assente -> pulisce lo stato locale e torna al login
 *   (disattivabile con redirectOn401: false, per il login stesso)
 */
export function checkResponse(response, data, { fallback = DEFAULT_MESSAGE, redirectOn401 = true } = {}) {
  if (response.ok) return data;

  if (response.status === 401 && redirectOn401) {
    clearStoredUser();
    localStorage.removeItem("newOrdersCount");
    window.location.href = "/pages/common/login.html?expired=1";
    throw new Error("Sessione scaduta. Effettua di nuovo l'accesso.");
  }

  // Errori di validazione: usa il primo messaggio trovato
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    throw new Error(data.errors[0].msg || data.errors[0].message || fallback);
  }

  // Errore con campo message singolo (es. "Email già in uso")
  if (data?.message) {
    throw new Error(data.message);
  }

  throw new Error(fallback);
}