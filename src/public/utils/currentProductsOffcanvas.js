import { getRestaurantProducts, deleteProduct, deleteAllProduct } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";

let currentRestaurantId = null;

/**
 * Inizializza gli eventi del pannello "I Tuoi Prodotti"
 */
export function initCurrentProductsOffcanvas(restaurantId) {
  currentRestaurantId = restaurantId;

  const deleteAllBtn = document.getElementById("deleteAllBtn");
  const confirmModalEl = document.getElementById("deleteAllMenuConfirmModal");
  const confirmModal = confirmModalEl ? bootstrap.Modal.getOrCreateInstance(confirmModalEl) : null;
  const confirmDeleteBtn = document.getElementById("confirmDeleteAllMenuBtn");

  // Apertura modale di conferma
  deleteAllBtn?.addEventListener("click", () => {
    if (confirmModal) confirmModal.show();
  });

  // Conferma eliminazione totale
  confirmDeleteBtn?.addEventListener("click", async () => {
    if (!currentRestaurantId) return;

    try {
      if (confirmModal) confirmModal.hide();

      await deleteAllProduct(currentRestaurantId);
      showAlert("danger", "Menù eliminato");

      const currentMenuList = document.getElementById("currentMenuList");
      if (currentMenuList) {
        currentMenuList.innerHTML = `
          <div class="menu-empty-msg" id="emptyCurrentMenuMsg">
            Il tuo menù è ancora vuoto.<br>Aggiungi i tuoi primi piatti dal catalogo!
          </div>`;
      }
      if (deleteAllBtn) deleteAllBtn.disabled = true;

    } catch (error) {
      console.error("Errore eliminazione menù:", error);
      showAlert("danger", "Attenzione", error);
    }
  });

  // Primo caricamento prodotti
  if (currentRestaurantId) {
    loadCurrentRestaurantMenu();
  }
}

/**
 * Carica dal database e renderizza i prodotti salvati
 */
export async function loadCurrentRestaurantMenu() {
  const currentMenuList = document.getElementById("currentMenuList");
  const deleteAllBtn = document.getElementById("deleteAllBtn");
  if (!currentMenuList || !currentRestaurantId) return;

  try {
    const res = await getRestaurantProducts(currentRestaurantId);
    const products = res.data || [];

    if (products.length === 0) {
      currentMenuList.innerHTML = `
        <div class="menu-empty-msg" id="emptyCurrentMenuMsg">
          Il tuo menù è ancora vuoto.<br>Aggiungi i tuoi primi piatti dal catalogo!
        </div>`;
      if (deleteAllBtn) deleteAllBtn.disabled = true;
      return;
    }

    if (deleteAllBtn) deleteAllBtn.disabled = false;
    currentMenuList.innerHTML = "";

    products.forEach((product) => {
      const item = document.createElement("div");
      item.className = "recent-meal-item d-flex align-items-center justify-content-between p-2 rounded menu-modal-content";

      item.innerHTML = `
        <div class="d-flex align-items-center gap-2 text-truncate pe-2">
          <img src="${product.image || '/assets/defaultMeal.jpeg'}" width="42" height="42" class="rounded object-fit-cover" alt="${product.nameMeal}" onerror="this.src='/assets/defaultMeal.jpeg'">
          <div class="text-truncate">
            <div class="fw-semibold text-white text-truncate">${product.nameMeal}</div>
            <small class="text-warning">${Number(product.price).toFixed(2)} €</small>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-secondary">${product.category || 'Altro'}</span>
          <button type="button" class="btn-delete-recent" title="Rimuovi piatto dal menù" aria-label="Rimuovi piatto dal menù">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      `;

      // Eliminazione singolo piatto salvato
      const deleteBtn = item.querySelector(".btn-delete-recent");
      deleteBtn?.addEventListener("click", async (event) => {
        event.stopPropagation();
        try {
          await deleteProduct(product._id);
          await loadCurrentRestaurantMenu();
          showAlert("danger", "Prodotto rimosso");
        } catch (error) {
          console.error("Errore rimozione prodotto:", error);
          showAlert("danger", error);
        }
      });

      currentMenuList.appendChild(item);
    });

  } catch (err) {
    console.error("Errore caricamento prodotti:", err);
  }
}