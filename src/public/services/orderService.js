export async function createOrder(orderPayload) {
  const response = await fetch("/api/orders/create", {
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

export async function getOrdersByCustomer(customerId, page = 1, limit = 12) {
  const response = await fetch(`/api/orders/customer/${customerId}?page=${page}&limit=${limit}`, {
    method: "GET"
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Errore nel recupero degli ordini");
  }

  return data; // { status, data, pagination }
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