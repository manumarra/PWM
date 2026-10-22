import { getStoredUser } from "/utils/common/session.js";
import { getOrdersByCustomer } from "/services/orderService.js";
import { showAlert } from "/components/alerts.js";

const spinner = document.getElementById("loadingOrdersSpinner");
const activeSection = document.getElementById("activeOrdersSection");
const pastSection = document.getElementById("pastOrdersSection");
const activeGrid = document.getElementById("activeOrdersGrid");
const pastGrid = document.getElementById("pastOrdersGrid");
const emptyMsg = document.getElementById("emptyOrdersMsg");
const scrollSentinel = document.getElementById("scrollSentinel");

// Variabili per l'Infinite Scroll
let customer = null;
let currentPage = 1;
const limit = 12;
let isLoading = false;
let hasNextPage = true;

document.addEventListener("DOMContentLoaded", async () => {
  customer = getStoredUser();
  if (!customer) {
    showAlert("danger", "Errore", "Devi effettuare il login per vedere gli ordini.");
    return setTimeout(() => window.location.href = "/pages/common/login.html", 1500);
  }

  // 1. Carica la prima pagina
  await loadMoreOrders();

  // 2. Inizializza l'osservatore per lo scroll infinito
  setupIntersectionObserver();
});

async function loadMoreOrders() {
  if (isLoading || !hasNextPage) return;
  isLoading = true;

  if (currentPage === 1) {
    spinner.classList.remove("d-none");
  } else {
    scrollSentinel.classList.remove("d-none");
  }

  try {
    const response = await getOrdersByCustomer(customer._id || customer.id, currentPage, limit);
    const orders = response.data || [];
    
    // Aggiorniamo la flag per capire se ci sono altri record
    hasNextPage = response.pagination ? response.pagination.hasNext : false;

    if (currentPage === 1 && orders.length === 0) {
      emptyMsg.classList.remove("d-none");
      return;
    }

    renderOrders(orders);
    currentPage++; // Avanziamo di pagina per il prossimo scroll
    
  } catch (error) {
    showAlert("danger", "Errore", error.message);
  } finally {
    isLoading = false;
    spinner.classList.add("d-none");
    
    if (!hasNextPage) {
      scrollSentinel.classList.add("d-none"); // Nascondiamo se abbiamo finito
    }
  }
}

function setupIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    // Se la sentinella è visibile e abbiamo altre pagine, carica i nuovi dati
    if (entries[0].isIntersecting && hasNextPage && !isLoading) {
      loadMoreOrders();
    }
  }, { rootMargin: "100px" });

  observer.observe(scrollSentinel);
}

function renderOrders(orders) {
  // Dividiamo gli ordini (in corso vs passati)
  const activeOrders = orders.filter(o => o.status !== "consegnato");
  const pastOrders = orders.filter(o => o.status === "consegnato");

  if (activeOrders.length > 0) {
    activeSection.classList.remove("d-none");
    const activeHtml = activeOrders.map(o => createOrderCard(o, true)).join("");
    // Usiamo insertAdjacentHTML per aggiungere senza sovrascrivere i vecchi
    activeGrid.insertAdjacentHTML("beforeend", activeHtml);
  }

  if (pastOrders.length > 0) {
    pastSection.classList.remove("d-none");
    const pastHtml = pastOrders.map(o => createOrderCard(o, false)).join("");
    pastGrid.insertAdjacentHTML("beforeend", pastHtml);
  }
}

function createOrderCard(order, isActive) {
  const dateObj = new Date(order.createdAt);
  const dateStr = dateObj.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = dateObj.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  const restName = order.restaurantId?.name || "Ristorante non disponibile";
  
  const itemsHtml = order.items.map(i => `
    <div class="d-flex justify-content-between small text-secondary mb-1">
      <span>${i.quantity}x ${i.nameMeal}</span>
      <span>€${(i.price * i.quantity).toFixed(2)}</span>
    </div>
  `).join("");

  let statusBadgeClass = "";
  let statusText = "";
  switch(order.status) {
    case "ordinato": statusBadgeClass = "status-ordinato"; statusText = "Inviato al locale"; break;
    case "in preparazione": statusBadgeClass = "status-preparazione"; statusText = "In preparazione"; break;
    case "in consegna": statusBadgeClass = "status-consegna"; statusText = "In consegna"; break;
    case "consegnato": statusBadgeClass = "status-consegnato"; statusText = "Consegnato"; break;
  }

  // Riquadro per il codice di verifica OTP
  let otpBox = "";
  if (isActive && order.verificationCode) {
    otpBox = `
      <div class="otp-verification-box">
        <div class="otp-label"><i class="bi bi-shield-lock-fill me-1"></i> Codice di Consegna</div>
        <div class="otp-code">${order.verificationCode}</div>
        <div class="small text-secondary mt-1" style="font-size: 0.7rem; text-transform:none; letter-spacing:0;">
          Mostra questo codice per ritirare il tuo ordine
        </div>
      </div>
    `;
  }

  return `
    <div class="col">
      <div class="order-card-modern">
        <div class="order-card-header">
          <div>
            <h6 class="fw-bold mb-0 text-truncate">${restName}</h6>
            <small class="text-secondary">${dateStr} alle ${timeStr}</small>
          </div>
          <span class="badge-order-status ${statusBadgeClass}">${statusText}</span>
        </div>

        <div class="order-card-body">
          <div class="mb-3 border-bottom pb-3">
            ${itemsHtml}
          </div>
          ${otpBox}
        </div>

        <div class="order-card-footer">
          <span class="text-secondary small fw-semibold">Totale:</span>
          <span class="order-total-price">€ ${Number(order.totalAmount).toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
}