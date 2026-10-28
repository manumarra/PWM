import { getStoredUser } from "/utils/common/session.js";
import { getRestaurantById } from "/services/userService.js";
import { createOrder, getQuote } from "/services/orderService.js";
import { showAlert } from "/components/alerts.js";


// Riferimenti DOM
const form = document.getElementById("checkoutForm");
const itemsContainer = document.getElementById("checkoutItemsContainer");
const subtotalEl = document.getElementById("checkoutSubtotal");
const deliveryFeeEl = document.getElementById("checkoutDeliveryFee");
const totalAmountEl = document.getElementById("checkoutTotalAmount");
const submitBtn = document.getElementById("submitOrderBtn");

const deliveryAddressSection = document.getElementById("deliveryAddressSection");
const creditCardDetails = document.getElementById("creditCardDetails");
const osmMapContainer = document.getElementById("osmMapContainer");
const restaurantNameEl = document.getElementById("checkoutRestaurantName");

const streetInput = document.getElementById("streetInput");
const cityInput = document.getElementById("cityInput");
const zipInput = document.getElementById("zipInput");
const notesInput = document.getElementById("notesInput");

const mapStatusText = document.getElementById("mapStatusText");
const estimatedTimeEl = document.getElementById("estimatedTimeText");

// Variabili di stato
let cart = [];
let restaurantId = null;
let customerId = null;
let currentRestaurant = null;
let currentUser = null;
let subtotal = 0;
let deliveryFee = 0;
let distanceKm = 0;
let lastQuoteRequest = 0;
let mapInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  restaurantId = urlParams.get("restaurantId");
  customerId = urlParams.get("customerId");

  currentUser = getStoredUser();

  const storedCart = sessionStorage.getItem("checkoutCart");
  if (storedCart) cart = JSON.parse(storedCart);

  if (!restaurantId || !customerId || cart.length === 0 || !currentUser) {
    showAlert("danger", "Errore", "Dati mancanti o sessione scaduta. Ritorno alla home.");
    setTimeout(() => window.location.href = "/pages/customer/home.html", 1500);
    return;
  }

  // Pre-compilazione indirizzo cliente se presente
  if (currentUser.address) {
    streetInput.value = currentUser.address.street || "";
    cityInput.value = currentUser.address.city || "";
    zipInput.value = currentUser.address.zip || "";
  }

  await loadRestaurantData();
  setupEventListeners();
  renderSummary();
  
  refreshQuote();
});

async function loadRestaurantData() {
  try {
    const res = await getRestaurantById(restaurantId);
    currentRestaurant = res.data;
    if (restaurantNameEl && currentRestaurant) {
      restaurantNameEl.textContent = `Ordine da: ${currentRestaurant.name}`;
    }
  } catch (error) {
    showAlert("danger", "Attenzione", "Impossibile recuperare i dati del ristorante.");
  }
}

function setupEventListeners() {
  // Toggle Tipo Ordine
  document.querySelectorAll('input[name="orderType"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      const isDelivery = e.target.value === "delivery";
      deliveryAddressSection.style.display = isDelivery ? "block" : "none";
      
      streetInput.required = isDelivery;
      cityInput.required = isDelivery;
      zipInput.required = isDelivery;

      if (!isDelivery) { // TAKEAWAY
        deliveryFee = 0;
        distanceKm = 0;
        if (mapInstance !== null) {
          mapInstance.remove();
          mapInstance = null;
        }
        osmMapContainer.classList.add("d-none");
        updateTotals();
      }
      refreshQuote();
    });
  });

  // Toggle Metodo Pagamento
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      creditCardDetails.style.display = e.target.value === "credit_card" ? "flex" : "none";
    });
  });

  // Debounce per calcolare la distanza
  let timeout = null;
  const triggerMapUpdate = () => {
    clearTimeout(timeout);
    timeout = setTimeout(refreshQuote, 1200);
  };

  streetInput.addEventListener("input", triggerMapUpdate);
  cityInput.addEventListener("input", triggerMapUpdate);

  form.addEventListener("submit", handleOrderSubmit);
}

function renderSummary() {
  itemsContainer.innerHTML = "";
  subtotal = 0;

  cart.forEach(item => {
    const p = item.product;
    const basePrice = Number(p.price) || 0;
    const discountVal = Number(p.discount) || 0;
    const finalPrice = discountVal > 0 ? basePrice - (basePrice * discountVal / 100) : basePrice;
    
    const lineTotal = finalPrice * item.qty;
    subtotal += lineTotal;

    const row = document.createElement("div");
    row.className = "total-row";
    row.innerHTML = `
      <span><strong>${item.qty}x</strong> ${p.nameMeal}</span>
      <span>€${lineTotal.toFixed(2)}</span>
    `;
    itemsContainer.appendChild(row);
  });

  updateTotals();
}

function updateTotals() {
  const total = subtotal + deliveryFee;
  subtotalEl.textContent = `€ ${subtotal.toFixed(2)}`;
  deliveryFeeEl.textContent = `€ ${deliveryFee.toFixed(2)}`;
  totalAmountEl.textContent = `€ ${total.toFixed(2)}`;
}

async function refreshQuote() {
  const isDelivery = document.querySelector('input[name="orderType"]:checked').value === "delivery";
  const street = streetInput.value.trim();
  const city = cityInput.value.trim();

  submitBtn.disabled = true;

  if (isDelivery && (!street || !city)) {
    mapStatusText.innerHTML = `<p class="text-secondary small m-0">Compila i campi Indirizzo e Città per calcolare la consegna.</p>`;
    osmMapContainer.classList.add("d-none");
    return;
  }

  if (isDelivery) {
    mapStatusText.innerHTML = `<p class="loading-text m-0">Calcolo del percorso in corso...</p>`;
  }

  const requestId = ++lastQuoteRequest;
  try {
    const res = await getQuote({
      restaurantId,
      orderType: isDelivery ? "delivery" : "takeaway",
      items: cart.map(item => ({ productId: item.product._id, quantity: item.qty })),
      deliveryAddress: isDelivery ? { street, city } : undefined
    });
    if (requestId !== lastQuoteRequest) return; // c'è una richiesta più recente
    const q = res.data;

    subtotal = q.subtotal;
    deliveryFee = q.deliveryFee;
    distanceKm = q.distanceKm;
    estimatedTimeEl.textContent = `Tempo di attesa stimato: circa ${q.estimatedTimeMinutes} minuti`;

    if (isDelivery) {
      const label = q.route.method === "road"
        ? "Distanza stradale"
        : "Distanza in linea d'aria (percorso non disponibile)";
      mapStatusText.innerHTML = `
        <p class="text-success m-0 fw-bold">
          <i class="bi bi-geo-alt-fill"></i> ${label}: ${q.distanceKm.toFixed(1)} km
        </p>
      `;
      renderMap(q.route);
    }

    submitBtn.disabled = false;
    updateTotals();
  } catch (error) {
    if (requestId !== lastQuoteRequest) return;
    deliveryFee = 0;
    distanceKm = 0;
    estimatedTimeEl.textContent = "";
    osmMapContainer.classList.add("d-none");
    updateTotals();

    if (isDelivery) {
      mapStatusText.innerHTML = "";
      const msg = document.createElement("p");
      msg.className = "text-danger fw-bold m-0";
      msg.textContent = error.message;
      mapStatusText.appendChild(msg);
    } else {
      showAlert("danger", "Attenzione", error.message);
    }
  }
}

async function handleOrderSubmit(e) {
  e.preventDefault();
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const orderType = document.querySelector('input[name="orderType"]:checked').value;
  const payMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  
  const itemsPayload = cart.map(item => {
    const p = item.product;
    const finalPrice = p.discount > 0 ? p.price - (p.price * p.discount / 100) : p.price;
    return {
      productId: p._id,
      nameMeal: p.nameMeal,
      price: finalPrice,
      quantity: item.qty
    };
  });

  const orderData = {
    customerId: customerId,
    restaurantId: restaurantId,
    items: itemsPayload,
    orderType: orderType,
    subtotal: Number(subtotal.toFixed(2)),
    totalAmount: Number((subtotal + deliveryFee).toFixed(2)),
    payment: {
      provider: payMethod === "credit_card" ? "stripe" : "mock",
      method: payMethod === "credit_card" ? "credit_card" : "prepaid_card",
      status: "in_attesa"
    }
  };

  if (orderType === "delivery") {
    orderData.deliveryAddress = {
      street: streetInput.value.trim(),
      city: cityInput.value.trim(),
      zip: zipInput.value.trim(),
      notes: notesInput.value.trim()
    };
    orderData.distanceKm = Number(distanceKm.toFixed(1));
    orderData.deliveryFee = Number(deliveryFee.toFixed(2));
  }

  if (payMethod === "credit_card") {
    const ccNum = document.getElementById("ccNumber").value.replace(/\s/g, "");
    if (ccNum.length >= 4) orderData.payment.last4Digits = ccNum.slice(-4);
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Elaborazione in corso...";

    await createOrder(orderData);
    
    sessionStorage.removeItem("checkoutCart");
    showAlert("success", "Ordine Creato!", "Reindirizzamento allo storico...");
    
    setTimeout(() => {
      window.location.href = "/pages/customer/orderHistory.html";
    }, 500);

  } catch (err) {
    showAlert("danger", "Errore", err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Conferma Ordine";
  }
}

function renderMap(route) {
  osmMapContainer.classList.remove("d-none");

  if (mapInstance !== null) {
    mapInstance.remove();
  }

  mapInstance = L.map('osmMapContainer');

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapInstance);

  L.marker([route.restaurant.lat, route.restaurant.lon]).addTo(mapInstance)
    .bindPopup(`<b>${currentRestaurant.name}</b><br>Partenza`);
  L.marker([route.customer.lat, route.customer.lon]).addTo(mapInstance)
    .bindPopup("<b>La tua consegna</b><br>Arrivo");

  // Percorso stradale (continuo) oppure linea d'aria (tratteggiata)
  const polyline = L.polyline(route.path, {
    color: '#dc3545',
    weight: 4,
    dashArray: route.method === "road" ? null : '5, 10'
  }).addTo(mapInstance);

  mapInstance.fitBounds(polyline.getBounds(), { padding: [40, 40] });
}