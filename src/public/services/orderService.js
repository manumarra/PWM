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

export async function getOrdersByRestaurant(restaurantId) {
  const response = await fetch(`/api/orders/restaurant/${restaurantId}`, {
    method: "GET"
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Errore nel recupero degli ordini");
  }

  return data;
}

export async function updateOrderStatus(orderId, status, verificationCode = null) {
  const payload = { status };
  if (verificationCode) payload.verificationCode = verificationCode;

  const response = await fetch(`/api/orders/update-status/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Errore nell'aggiornamento dello stato");
  return data;
}

export async function getRestaurantOrderHistory(restaurantId, page = 1, limit = 12) {
  const response = await fetch(`/api/orders/restaurant/${restaurantId}/history?page=${page}&limit=${limit}`, {
    method: "GET"
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Errore nel recupero dello storico ordini");
  }

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