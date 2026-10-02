const USER = "user";

/**
 * Recupera i dati dell'utente salvati nel localStorage
 * @returns {object|null}
 */
export function getStoredUser() {
  const userStr = localStorage.getItem(USER);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Errore nel parsing della sessione utente:", error);
    return null;
  }
}

/**
 * Salva o aggiorna i dati dell'utente nel localStorage
 * @param {object} userData
 */
export function setStoredUser(userData) {
  if (!userData || typeof userData !== "object") return;
  localStorage.setItem(USER, JSON.stringify(userData));
}

/**
 * Rimuove i dati di sessione (usata per il logout)
 */
export function clearStoredUser() {
  localStorage.removeItem(USER);
}