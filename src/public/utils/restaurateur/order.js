import { escapeHtml } from "/utils/common/dishUi.js";
import { getStoredUser } from "/utils/common/session.js";
import { getOrdersByRestaurant, updateOrderStatus } from "/services/orderService.js";
import { showAlert } from "/components/alerts.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = getStoredUser();
  if (!user || user.role !== "restaurateur") {
      window.location.href = "/pages/common/login.html";
      return;
  }
  await loadOrders(user._id);

  // Il notificatore globale (orderNotifier.js) fa il polling: qui basta ascoltare
  window.addEventListener("restaurant-orders:updated", (event) => {
    renderOrders(event.detail.orders);
  });
});

async function loadOrders(restaurantId) {
  try {
    const response = await getOrdersByRestaurant(restaurantId);
    renderOrders(response.data || []);
  } catch (error) {
    showAlert("danger", "Errore", "Impossibile caricare gli ordini: " + error.message);
  }
}

function renderOrders(orders) {
  const colOrdinato = document.getElementById("col-ordinato");
  const colPreparazione = document.getElementById("col-preparazione");
  const colConsegna = document.getElementById("col-consegna");
  const colConsegnato = document.getElementById("col-consegnato");

  colOrdinato.innerHTML = "";
  colPreparazione.innerHTML = "";
  colConsegna.innerHTML = "";
  colConsegnato.innerHTML = "";

  // Contatori
  let countOrdinato = 0, countPreparazione = 0, countConsegna = 0, countConsegnato = 0;

  // Mezzanotte di oggi
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filtriamo gli ordini: TUTTI gli attivi + SOLO i consegnati di oggi
  const activeAndTodayOrders = orders.filter(o => {
    if (o.status !== "consegnato") return true; // Mantieni sempre gli ordini in corso (anche di ieri sera)
    
    // Se è consegnato, mantienilo solo se è stato creato oggi
    const orderDate = new Date(o.createdAt);
    return orderDate.getTime() >= today.getTime(); 
  });

  // (il più vecchio in alto)
  const sortedOrders = [...activeAndTodayOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  sortedOrders.forEach(o => {
    const timeStr = new Date(o.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const customerName = o.customerId?.name || "Cliente Sconosciuto";
    const isDelivery = o.orderType === "delivery";
    const address = isDelivery && o.deliveryAddress 
        ? `${o.deliveryAddress.street}, ${o.deliveryAddress.city}` 
        : "Asporto (Ritiro in Locale)";

    let actionHtml = "";

    // Azioni in base allo stato
    switch(o.status) {
      case "ordinato": 
        countOrdinato++;
        actionHtml = `<button class="btn btn-amber w-100 action-btn fw-bold" data-id="${o._id}" data-name="${customerName}" data-status="in preparazione">Accetta e Prepara</button>`;
        break;
        
      case "in preparazione": 
        countPreparazione++;
        if (isDelivery) {
            actionHtml = `<button class="btn btn-amber w-100 action-btn fw-bold" data-id="${o._id}" data-name="${customerName}" data-status="in consegna">Affida al Fattorino</button>`;
        } else {
            actionHtml = `
              <div class="input-group mt-2">
                <input type="text" class="form-control bg-dark text-white border-secondary" id="otp-${o._id}" placeholder="Codice OTP" maxlength="6">
                <button class="btn btn-amber action-btn fw-bold" data-id="${o._id}" data-name="${customerName}" data-status="consegnato">Verifica e Consegna</button>
              </div>
            `;
        }
        break;
        
      case "in consegna": 
        countConsegna++;
        actionHtml = `
          <div class="input-group mt-2">
            <input type="text" class="form-control bg-dark text-white border-secondary" id="otp-${o._id}" placeholder="Codice OTP" maxlength="6">
            <button class="btn btn-amber action-btn fw-bold" data-id="${o._id}" data-name="${customerName}" data-status="consegnato">Verifica</button>
          </div>
        `;
        break;
        
      case "consegnato": 
        countConsegnato++;
        actionHtml = `<span class="text-success fw-bold d-block text-center mt-2" data-name="${customerName}"><i class="bi bi-check-circle-fill me-2"></i>Consegna Completata</span>`;
        break;
    }


    // lista dei piatti per questo ordine
    const itemsHtml = (o.items || []).map(i => `
      <div class="d-flex justify-content-between small text-secondary mb-1">
        <span><strong class="text-white">${i.quantity}x</strong> ${escapeHtml(i.nameMeal)} </span>
        <span class="text-white"> €${(i.price * i.quantity).toFixed(2)}</span>
      </div>
    `).join("");

    const typeClass = isDelivery ? 'is-delivery' : 'is-takeaway';
    const typeIcon = isDelivery ? '<i class="bi bi-bicycle icon-delivery me-1"></i>' : '<i class="bi bi-shop icon-takeaway me-1"></i>';
    // HTML della singola card
    const cardHtml = `
      <div class="order-card-modern p-3 h-100 ${typeClass}">
        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
          <div class="w-100">
              <h6 class="fw-bold mb-0 text-white text-truncate">${customerName}</h6>
              <small class="text-secondary">${timeStr} • ${isDelivery ? "Domicilio" : "Asporto"}</small>
          </div>
        </div>
        
        <div class="mb-3 border-bottom border-secondary pb-3">
          <small class="text-secondary d-block mb-3"><i class="bi bi-geo-alt-fill me-1"></i>${address}</small>
          ${itemsHtml}
        </div>

        <div class="d-flex justify-content-between align-items-center mb-3 mt-auto">
          <span class="text-secondary small fw-semibold">Totale:</span>
          <span class="order-total-price">€ ${Number(o.totalAmount).toFixed(2)}</span>
        </div>

        <div>
            ${actionHtml}
        </div>
      </div>
    `;

    // card nella colonna corretta
    if (o.status === "ordinato") colOrdinato.insertAdjacentHTML("beforeend", cardHtml);
    else if (o.status === "in preparazione") colPreparazione.insertAdjacentHTML("beforeend", cardHtml);
    else if (o.status === "in consegna") colConsegna.insertAdjacentHTML("beforeend", cardHtml);
    else if (o.status === "consegnato") colConsegnato.insertAdjacentHTML("beforeend", cardHtml);
  });

  // colonne vuote
  if (countOrdinato === 0) colOrdinato.innerHTML = `<p class="text-secondary small text-center mt-4">Nessun ordine.</p>`;
  if (countPreparazione === 0) colPreparazione.innerHTML = `<p class="text-secondary small text-center mt-4">Nessuna preparazione.</p>`;
  if (countConsegna === 0) colConsegna.innerHTML = `<p class="text-secondary small text-center mt-4">Nessuna consegna.</p>`;
  if (countConsegnato === 0) colConsegnato.innerHTML = `<p class="text-secondary small text-center mt-4">Nessun ordine consegnato.</p>`;

  document.getElementById("count-ordinato").textContent = countOrdinato;
  document.getElementById("count-preparazione").textContent = countPreparazione;
  document.getElementById("count-consegna").textContent = countConsegna;
  document.getElementById("count-consegnato").textContent = countConsegnato;

  localStorage.setItem("newOrdersCount", countOrdinato);
  if (typeof window.updateNavBadge === "function") window.updateNavBadge();
  
  // Event listener per i bottoni
  document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleStatusChange);
  });
}

async function handleStatusChange(e) {
    const btn = e.currentTarget;
    const orderId = btn.getAttribute('data-id');
    const customerName = btn.getAttribute('data-name');
    const newStatus = btn.getAttribute('data-status');
    let verificationCode = null;
    let showStr = `spostato ${newStatus}`;
    if (newStatus === "consegnato") {
        const otpInput = document.getElementById(`otp-${orderId}`);
        showStr = "CONSEGNATO";
        verificationCode = otpInput.value.trim();
        if (!verificationCode) {
            return showAlert("danger", "Attenzione", "Inserisci il codice di verifica fornito dal cliente.");
        }
    }

    try {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
        
        await updateOrderStatus(orderId, newStatus, verificationCode);
        showAlert("success", `Ordine di ${customerName}`, showStr);
        const user = getStoredUser();
        await loadOrders(user._id);
    } catch (error) {
        btn.disabled = false;
        btn.innerHTML = newStatus === "consegnato" ? "Verifica" : "Errore";
        showAlert("danger", "Errore", error.message);
    }
}