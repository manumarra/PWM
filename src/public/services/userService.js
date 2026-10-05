// public/services/userService.js
export async function registerUser(payload) {
  const response = await fetch("/api/users/signup", { 
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
}

export async function loginUser(payload) {
  const response = await fetch("/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
}

export async function updateUser(payload) {
  const response = await fetch("/api/users/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
}

export async function deleteUser(payload) {
  const response = await fetch("/api/users/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify(payload)
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