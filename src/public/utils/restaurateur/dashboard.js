import { getStoredUser } from "/utils/common/session.js";
import { getOrdersByRestaurant } from "/services/orderService.js";
import { showAlert } from "/components/alerts.js";

const kpiPending = document.getElementById("kpiPendingOrders");
const kpiRevenue = document.getElementById("kpiTodayRevenue");
const recentContainer = document.getElementById("recentOrdersContainer");

document.addEventListener("DOMContentLoaded", async () => {
  const user = getStoredUser();
  if (!user || user.role !== "restaurateur") return;

  try {
    const response = await getOrdersByRestaurant(user._id);
    const orders = response.data || [];
    renderDashboard(orders);
  } catch (error) {
    if (recentContainer) {
      recentContainer.innerHTML = `<p class="text-danger small">Impossibile caricare gli ordini: ${error.message}</p>`;
    }
    showAlert("danger", "Errore", error.message);
  }
});

function renderDashboard(orders) {
  const pendingOrders = orders.filter(o => o.status === "ordinato" || o.status === "in preparazione");
  if (kpiPending) kpiPending.textContent = pendingOrders.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  
  const todayRevenue = orders
    .filter(o => new Date(o.createdAt).getTime() >= today.getTime() && o.status !== "fallito")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
    
  if (kpiRevenue) kpiRevenue.textContent = `€ ${todayRevenue.toFixed(2)}`;

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