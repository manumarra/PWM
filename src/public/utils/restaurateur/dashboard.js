import { getStoredUser } from "/utils/common/session.js";
import { getOrdersByRestaurant } from "/services/orderService.js";
import { showAlert, showToast } from "/components/alerts.js";

// Variabile globale per ricordare gli ID degli ordini
let knownOrderIds = new Set();
let isFirstLoad = true;

const kpiRevenue = document.getElementById("kpiTodayRevenue");
const kpiNew = document.getElementById("kpiNew");
const kpiPrep = document.getElementById("kpiPrep");
const kpiDelivery = document.getElementById("kpiDelivery");
const kpiCompleted = document.getElementById("kpiCompleted");
const recentContainer = document.getElementById("recentOrdersContainer");

document.addEventListener("DOMContentLoaded", async () => {
  const user = getStoredUser();
  if (!user || user.role !== "restaurateur") return;

  // Primo caricamento
  await loadDashboard(user._id);

  // Polling per aggiornare la dashboard e cercare nuovi ordini ogni 15 secondi
  setInterval(() => {
    loadDashboard(user._id);
  }, 15000);
});

async function loadDashboard(restaurantId) {
  try {
    const response = await getOrdersByRestaurant(restaurantId);
    const orders = response.data || [];
    
    // Logica per i Toast: intercetta i nuovi ordini arrivati in stato "ordinato"
    if (!isFirstLoad) {
      orders.forEach(o => {
        if (!knownOrderIds.has(o._id) && o.status === "ordinato") {
           const customerName = o.customerId?.name || "Un cliente";
           showToast(
             "Nuovo Ordine Ricevuto!", 
             `Hai appena ricevuto un nuovo ordine da <b>${customerName}</b> per €${Number(o.totalAmount).toFixed(2)}.`, 
             "success"
           );
        }
      });
    }

    // Memorizza gli ID per il prossimo ciclo
    knownOrderIds = new Set(orders.map(o => o._id));
    isFirstLoad = false;
    
    // Aggiorna l'interfaccia della dashboard (i KPI e la lista recenti)
    renderDashboard(orders);
  } catch (error) {
    if (recentContainer) {
      recentContainer.innerHTML = `<p class="text-danger small">Impossibile caricare gli ordini: ${error.message}</p>`;
    }
    showAlert("danger", "Errore", error.message);
  }
}

function renderDashboard(orders) {
const today = new Date();
  today.setHours(0, 0, 0, 0); 

  let countNew = 0, countPrep = 0, countDelivery = 0, countCompletedToday = 0;
  let todayRevenue = 0;

  orders.forEach(o => {
    const isToday = new Date(o.createdAt).getTime() >= today.getTime();

    // 1. Conteggi per stato
    if (o.status === "ordinato") countNew++;
    else if (o.status === "in preparazione") countPrep++;
    else if (o.status === "in consegna") countDelivery++;
    else if (o.status === "consegnato" && isToday) countCompletedToday++;

    // 2. Calcolo incasso (solo quelli di oggi che non sono falliti)
    if (isToday && o.status !== "fallito") {
      todayRevenue += Number(o.totalAmount);
    }
  });

  // Aggiornamento DOM
  if (kpiRevenue) kpiRevenue.textContent = `€ ${todayRevenue.toFixed(2)}`;
  if (kpiNew) kpiNew.textContent = countNew;
  if (kpiPrep) kpiPrep.textContent = countPrep;
  if (kpiDelivery) kpiDelivery.textContent = countDelivery;
  if (kpiCompleted) kpiCompleted.textContent = countCompletedToday;

  if (!recentContainer) return;
  const recentOrders = orders.slice(0, 4);

  if (recentOrders.length === 0) {
    recentContainer.innerHTML = `<p class="text-secondary small">Nessun ordine ricevuto finora.</p>`;
    return;
  }

  recentContainer.innerHTML = recentOrders.map(o => {
    const timeStr = new Date(o.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const customerName = o.customerId?.name || "Cliente Sconosciuto";

    let statusBadgeClass = "";
    let statusText = "";
    switch(o.status) {
      case "ordinato": statusBadgeClass = "status-ordinato"; statusText = "Nuovo"; break;
      case "in preparazione": statusBadgeClass = "status-preparazione"; statusText = "In prep."; break;
      case "in consegna": statusBadgeClass = "status-consegna"; statusText = "In consegna"; break;
      case "consegnato": statusBadgeClass = "status-consegnato"; statusText = "Consegnato"; break;
    }

    return `
      <div class="col-12 col-lg-6">
        <div class="order-card-modern">
          <div class="order-card-header">
            <div>
              <h6 class="fw-bold mb-0 text-truncate text-white">${customerName}</h6>
              <small class="text-secondary">${timeStr}</small>
            </div>
            <span class="badge-order-status ${statusBadgeClass}">${statusText}</span>
          </div>
          <div class="order-card-body d-flex justify-content-end align-items-center">
             <span class="order-total-price">€ ${Number(o.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}