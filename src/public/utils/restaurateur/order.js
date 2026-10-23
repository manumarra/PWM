import { getStoredUser } from "/utils/common/session.js";
import { getOrdersByRestaurant, updateOrderStatus } from "/services/orderService.js";
import { showAlert, showToast } from "/components/alerts.js";

// Variabile globale per ricordare gli ID degli ordini
let knownOrderIds = new Set();
let isFirstLoad = true; // Per evitare toast su tutti gli ordini appena carichi la pagina la prima volta

document.addEventListener("DOMContentLoaded", async () => {
  const user = getStoredUser();
  if (!user || user.role !== "restaurateur") {
      window.location.href = "/pages/common/login.html";
      return;
  }
  await loadOrders(user._id);

  setInterval(() => {
    loadOrders(user._id);
  }, 15000);
});

async function loadOrders(restaurantId) {
  try {
    const response = await getOrdersByRestaurant(restaurantId);
    const orders = response.data || [];
    
    // Controlla se ci sono ordini NUOVI rispetto all'ultimo caricamento
    if (!isFirstLoad) {
      orders.forEach(o => {
        // Se l'ID non è tra quelli conosciuti e lo stato è "ordinato" (nuovo), spara il toast
        if (!knownOrderIds.has(o._id) && o.status === "ordinato") {
           const customerName = o.customerId?.name || "Un cliente";
           showToast("Nuovo Ordine Ricevuto!", `Hai appena ricevuto un nuovo ordine da <b>${customerName}</b> per €${Number(o.totalAmount).toFixed(2)}.`, "success");
        }
      });
    }

    // Aggiorna l'elenco degli ordini conosciuti per il prossimo refresh
    knownOrderIds = new Set(orders.map(o => o._id));
    isFirstLoad = false; // Dal prossimo caricamento in poi, faremo scattare i toast
    
    renderOrders(orders);
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
        actionHtml = `<button class="btn btn-amber w-100 action-btn fw-bold" data-id="${o._id}" data-status="in preparazione">Accetta e Prepara</button>`;
        break;
      case "in preparazione": 
        countPreparazione++;
        actionHtml = `<button class="btn btn-amber w-100 action-btn fw-bold" data-id="${o._id}" data-status="in consegna">${isDelivery ? 'Affida al Fattorino' : 'Pronto per Ritiro'}</button>`;
        break;
      case "in consegna": 
        countConsegna++;
        // MACRO-SCENARIO 4: Input OTP
        actionHtml = `
          <div class="input-group mt-2">
            <input type="text" class="form-control bg-dark text-white border-secondary" id="otp-${o._id}" placeholder="Codice OTP" maxlength="6">
            <button class="btn btn-amber action-btn fw-bold" data-id="${o._id}" data-status="consegnato">Verifica</button>
          </div>
        `;
        break;
      case "consegnato": 
        countConsegnato++;
        actionHtml = `<span class="text-success fw-bold d-block text-center mt-2"><i class="bi bi-check-circle-fill me-2"></i>Consegna Completata</span>`;
        break;
    }


    // Generiamo la lista dei piatti per questo ordine
    const itemsHtml = (o.items || []).map(i => `
      <div class="d-flex justify-content-between small text-secondary mb-1">
        <span><strong class="text-white">${i.quantity}x</strong> ${i.nameMeal} </span>
        <span class="text-white"> €${(i.price * i.quantity).toFixed(2)}</span>
      </div>
    `).join("");

    // HTML della singola card senza vincoli di colonna
    const cardHtml = `
      <div class="order-card-modern p-3 h-100">
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

    // Inseriamo la card nella colonna corretta
    if (o.status === "ordinato") colOrdinato.insertAdjacentHTML("beforeend", cardHtml);
    else if (o.status === "in preparazione") colPreparazione.insertAdjacentHTML("beforeend", cardHtml);
    else if (o.status === "in consegna") colConsegna.insertAdjacentHTML("beforeend", cardHtml);
    else if (o.status === "consegnato") colConsegnato.insertAdjacentHTML("beforeend", cardHtml);
  });

  // Mostra messaggi se le colonne sono vuote
  if (countOrdinato === 0) colOrdinato.innerHTML = `<p class="text-secondary small text-center mt-4">Nessun ordine.</p>`;
  if (countPreparazione === 0) colPreparazione.innerHTML = `<p class="text-secondary small text-center mt-4">Nessun ordine.</p>`;
  if (countConsegna === 0) colConsegna.innerHTML = `<p class="text-secondary small text-center mt-4">Nessun ordine.</p>`;
  if (countConsegnato === 0) colConsegnato.innerHTML = `<p class="text-secondary small text-center mt-4">Nessun ordine.</p>`;

  // Aggiorniamo i numeretti visivi
  document.getElementById("count-ordinato").textContent = countOrdinato;
  document.getElementById("count-preparazione").textContent = countPreparazione;
  document.getElementById("count-consegna").textContent = countConsegna;
  document.getElementById("count-consegnato").textContent = countConsegnato;

  // Event listener per i bottoni
  document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleStatusChange);
  });
}

async function handleStatusChange(e) {
    const btn = e.currentTarget;
    const orderId = btn.getAttribute('data-id');
    const newStatus = btn.getAttribute('data-status');
    let verificationCode = null;

    if (newStatus === "consegnato") {
        const otpInput = document.getElementById(`otp-${orderId}`);
        verificationCode = otpInput.value.trim();
        if (!verificationCode) {
            return showAlert("danger", "Attenzione", "Inserisci il codice di verifica fornito dal cliente.");
        }
    }

    try {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
        
        await updateOrderStatus(orderId, newStatus, verificationCode);
        
        const user = getStoredUser();
        await loadOrders(user._id || user.id);
    } catch (error) {
        btn.disabled = false;
        btn.innerHTML = newStatus === "consegnato" ? "Verifica" : "Errore";
        showAlert("danger", "Errore", error.message);
    }
}