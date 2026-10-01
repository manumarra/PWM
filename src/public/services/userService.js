// public/services/userService.js
export async function registerUser(payload) {
  const response = await fetch("/api/users/singup", { // oppure "/api/users" se hai usato router.post("/")
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // 1. Errore di validazione (Mongoose): estrae il testo del primo errore trovato
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(data.errors[0].msg || data.errors[0].message);
    }

    // 2. Errore con campo message singolo (es. "Email già in uso")[cite: 1]
    if (data?.message) {
      throw new Error(data.message);
    }

    // 3. Fallback generico pulito se non c'è un messaggio formattato
    throw new Error("Errore durante la registrazione. Riprova più tardi.");
  }

  return data;

}