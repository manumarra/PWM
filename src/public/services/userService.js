import { checkResponse } from "/services/http.js";

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
  checkResponse(response, data, { redirectOn401: false });
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

export async function getRestaurants({ page = 1, limit = 12, city = "", search = "", dish = "" } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (city) params.append("city", city);
  if (search) params.append("search", search);
  if (dish) params.append("dish", dish);

  const response = await fetch(`/api/users/restaurants?${params.toString()}`, {
    method: "GET"
  });
  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
}

export async function getRestaurantById(restaurantId) {
  const response = await fetch(`/api/users/restaurants/${encodeURIComponent(restaurantId)}`, {
    method: "GET"
  });
  const data = await response.json().catch(() => null);
  checkResponse(response, data);
  return data;
}