import { getStoredUser } from "/utils/common/session.js";
import { getRestaurantOrderHistory } from "/services/orderService.js";
import { showAlert } from "/components/alerts.js";

const historyGrid = document.getElementById("historyOrdersGrid");
const scrollSentinel = document.getElementById("scrollSentinel");
const loadingMsg = document.getElementById("loadingHistoryMsg");

let restaurantUser = null;
let currentPage = 1;
const limit = 12;
let isLoading = false;
let hasNextPage = true;

document.addEventListener("DOMContentLoaded", async () => {
  restaurantUser = getStoredUser();
  if (!restaurantUser || restaurantUser.role !== "restaurateur") {
      window.location.href = "/pages/common/login.html";
      return;
  }
  
  await loadMoreHistoryOrders();
  setupIntersectionObserver();
});

async function loadMoreHistoryOrders() {
  if (isLoading || !hasNextPage) return;
  isLoading = true;

  if (currentPage > 1) {
    scrollSentinel.classList.remove("d-none");
  }

  try {
    const response = await getRestaurantOrderHistory(restaurantUser._id || restaurantUser.id, currentPage, limit);
    const orders = response.data || [];
    
    hasNextPage = response.pagination ? response.pagination.hasNext : false;

    if (currentPage === 1) {
      loadingMsg.remove();
      if (orders.length === 0) {
        historyGrid.innerHTML = `<p class="text-secondary">Nessun ordine completato trovato nello storico.</p>`;
        return;
      }
    }

    renderHistoryOrders(orders);
    currentPage++;
    
  } catch (error) {
    showAlert("danger", "Errore", error.message);
    if (currentPage === 1) loadingMsg.textContent = "Errore nel caricamento.";
  } finally {
    isLoading = false;
    if (!hasNextPage) scrollSentinel.classList.add("d-none");
  }
}

function setupIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasNextPage && !isLoading) {
      loadMoreHistoryOrders();
    }
  }, { rootMargin: "100px" });

  if (scrollSentinel) observer.observe(scrollSentinel);
}

function renderHistoryOrders(orders) {
  const htmlChunks = orders.map(o => {
    const timeStr = new Date(o.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const customerName = o.customerId?.name || "Cliente Sconosciuto";
    const isDelivery = o.orderType === "delivery";
    
    const itemsHtml = (o.items || []).map(i => `
      <div class="d-flex justify-content-between small text-secondary mb-1">
        <span><strong class="text-white">${i.quantity}x</strong> ${i.nameMeal} </span>
        <span class="text-white"> €${(i.price * i.quantity).toFixed(2)}</span>
      </div>
    `).join("");

    return `
      <div class="col-12 col-md-6 col-lg-4 col-xl-3">
        <div class="order-card-modern p-3 d-flex flex-column h-100">
          <div class="d-flex justify-content-between align-items-start mb-3 border-bottom border-secondary pb-2">
            <div class="w-100">
                <h6 class="fw-bold mb-1 text-white text-truncate">${customerName}</h6>
                <small class="text-secondary d-block">${timeStr}</small>
                <small class="text-secondary d-block">${isDelivery ? "Consegna a Domicilio" : "Ritiro in Locale"}</small>
            </div>
          </div>
          
          <div class="mb-3 flex-grow-1 overflow-y-auto" style="max-height: 150px;">
            ${itemsHtml}
          </div>

          <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top border-secondary">
            <span class="text-secondary small fw-semibold">Totale Incassato:</span>
            <span class="order-total-price text-success">€ ${Number(o.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
  });

  historyGrid.insertAdjacentHTML("beforeend", htmlChunks.join(""));
}