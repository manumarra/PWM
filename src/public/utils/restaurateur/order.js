import { getStoredUser } from "/utils/common/session.js";
import { getOrdersByRestaurant, updateOrderStatus } from "/services/orderService.js";
import { showAlert } from "/components/alerts.js";

const ordersGrid = document.getElementById("restaurateurOrdersGrid");

document.addEventListener("DOMContentLoaded", async () => {
  const user = getStoredUser();
  if (!user || user.role !== "restaurateur") {
      window.location.href = "/pages/common/login.html";
      return;
  }
  await loadOrders(user._id);
});

async function loadOrders(restaurantId) {
  try {
    const response = await getOrdersByRestaurant(restaurantId);
    renderOrders(response.data || []);
  } catch (error) {
    ordersGrid.innerHTML = `<p class="text-danger">Errore nel caricamento: ${error.message}</p>`;
  }
}

function renderOrders(orders) {
  if (orders.length === 0) {
    ordersGrid.innerHTML = `<p class="text-secondary">Nessun ordine presente.</p>`;
    return;
  }

  ordersGrid.innerHTML = orders.map(o => {
    const timeStr = new Date(o.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const customerName = o.customerId?.name || "Cliente Sconosciuto";
    const isDelivery = o.orderType === "delivery";
    const address = isDelivery && o.deliveryAddress 
        ? `${o.deliveryAddress.street}, ${o.deliveryAddress.city}` 
        : "Asporto (Ritiro in Locale)";

    let statusBadgeClass = "";
    let statusText = "";
    let actionHtml = "";

    // Gestione degli stati e delle azioni per la card
    switch(o.status) {
      case "ordinato": 
        statusBadgeClass = "status-ordinato"; 
        statusText = "Nuovo"; 
        actionHtml = `<button class="btn btn-amber w-100 action-btn" data-id="${o._id}" data-status="in preparazione">Accetta e Prepara</button>`;
        break;
      case "in preparazione": 
        statusBadgeClass = "status-preparazione"; 
        statusText = "In preparazione"; 
        actionHtml = `<button class="btn btn-amber w-100 action-btn" data-id="${o._id}" data-status="in consegna">${isDelivery ? 'Affida al Fattorino' : 'Pronto per Ritiro'}</button>`;
        break;
      case "in consegna": 
        statusBadgeClass = "status-consegna"; 
        statusText = isDelivery ? "In consegna" : "In attesa ritiro"; 
        
        actionHtml = `
          <div class="input-group">
            <input type="text" class="form-control bg-dark text-white border-secondary" id="otp-${o._id}" placeholder="Codice OTP cliente" maxlength="6">
            <button class="btn btn-amber action-btn" data-id="${o._id}" data-status="consegnato">Verifica</button>
          </div>
        `;
        break;
      case "consegnato": 
        statusBadgeClass = "status-consegnato"; 
        statusText = "Completato"; 
        actionHtml = `<span class="text-success fw-bold d-block text-center"><i class="bi bi-check-circle-fill me-2"></i>Consegna Completata</span>`;
        break;
    }

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="order-card-modern p-3">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
            <div>
                <h6 class="fw-bold mb-0 text-white">${customerName}</h6>
                <small class="text-secondary">${timeStr} • ${isDelivery ? "Domicilio" : "Asporto"}</small>
            </div>
            <span class="badge-order-status ${statusBadgeClass}">${statusText}</span>
          </div>
          
          <div class="mb-4">
            <small class="text-secondary d-block mb-1"><i class="bi bi-geo-alt-fill me-1"></i>${address}</small>
            <span class="order-total-price d-block">€ ${Number(o.totalAmount).toFixed(2)}</span>
          </div>

          <div class="mt-auto">
             ${actionHtml}
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Aggiungi gli eventi ai nuovi pulsanti
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
        showAlert("success", "Operazione completata", "Stato dell'ordine aggiornato.");
        
        // Ricarica la lista per mostrare i cambiamenti
        const user = getStoredUser();
        await loadOrders(user._id);
    } catch (error) {
        btn.disabled = false;
        btn.innerHTML = newStatus === "consegnato" ? "Verifica" : "Errore";
        showAlert("danger", "Errore", error.message);
    }
}