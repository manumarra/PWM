export async function createOrder(orderPayload) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderPayload)
  });

  const data= await response.json().catch(()=> null);
  checkResponse(response,data);
  return data;
}

function checkResponse(response, data) {

  if (!response.ok) {
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(data.errors[0].msg || data.errors[0].message);
    }

    if (data?.message) {
      throw new Error(data.message);
    }

    throw new Error(error.message || "Si è verificato un errore durante la richiesta. Riprova più tardi.");
  }
  return data;
}