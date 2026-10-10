import { createProduct } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";

const recentlyAddedMeals = [];
let onEditProductCallback = null;
let onMenuSavedSuccessCallback = null;
let currentRestaurantId = null;

/**
 * Inizializza l'offcanvas dei piatti temporanei
 */
export function initRecentAddedOffcanvas({ restaurantId, onEditProduct, onMenuSaved }) {
  currentRestaurantId = restaurantId;
  onEditProductCallback = onEditProduct;
  onMenuSavedSuccessCallback = onMenuSaved;

  const btnSaveEntireMenu = document.getElementById("btnSaveEntireMenu");
  btnSaveEntireMenu?.addEventListener("click", () => {
    saveMenuToDatabase();
  });

  renderRecentAddedList();
}

/**
 * Aggiunge o aggiorna un piatto nella lista temporanea
 */
export function addOrUpdateRecentMeal(productData, editingIndex = null) {
  if (editingIndex !== null) {
    recentlyAddedMeals[editingIndex] = productData;
    showAlert("success", "Piatto modificato con successo");
  } else {
    recentlyAddedMeals.unshift(productData);
    showAlert("success", "Prodotto aggiunto alla lista");
  }
  renderRecentAddedList();
}

/**
 * Renderizza la lista temporanea e aggiorna il badge
 */
export function renderRecentAddedList() {
  const addedCountBadge = document.getElementById("addedCountBadge");
  const recentAddedList = document.getElementById("recentAddedList");

  if (addedCountBadge) addedCountBadge.textContent = recentlyAddedMeals.length;
  if (!recentAddedList) return;

  if (recentlyAddedMeals.length === 0) {
    recentAddedList.innerHTML = `
      <div class="menu-empty-msg" id="emptyRecentAddedMsg">
        Nessun piatto aggiunto in questa sessione.
      </div>`;
    return;
  }

  recentAddedList.innerHTML = "";

  recentlyAddedMeals.forEach((product, index) => {
    const item = document.createElement("div");
    item.className = "recent-meal-item d-flex align-items-center justify-content-between p-2 rounded menu-modal-content";

    const imgSrc = product.image || product.originalMeal?.image || "/assets/defaultMeal.jpeg";
    const catName = product.category || product.originalMeal?.category || "Altro";

    item.innerHTML = `
      <div class="d-flex align-items-center gap-2 text-truncate pe-2">
        <img src="${imgSrc}" width="42" height="42" class="rounded object-fit-cover" alt="${product.nameMeal}" onerror="this.src='/assets/defaultMeal.jpeg'">
        <div class="text-truncate">
          <div class="fw-semibold text-white text-truncate">${product.nameMeal}</div>
          <small class="text-warning">${Number(product.price).toFixed(2)} €</small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-secondary">${catName}</span>
        <button type="button" class="btn-delete-recent" title="Rimuovi piatto" aria-label="Rimuovi piatto">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    `;

    // Click sulla riga per riaprire la modale in modifica
    item.addEventListener("click", () => {
      const offcanvasEl = document.getElementById("offcanvasRecentAdded");
      const offcanvasInst = bootstrap.Offcanvas.getInstance(offcanvasEl);
      if (offcanvasInst) offcanvasInst.hide();

      if (typeof onEditProductCallback === "function") {
        onEditProductCallback(product, index);
      }
    });

    // Click sul cestino per rimuovere dalla sessione temporanea
    const deleteBtn = item.querySelector(".btn-delete-recent");
    deleteBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      recentlyAddedMeals.splice(index, 1);
      showAlert("danger", "Prodotto rimosso dalla lista");
      renderRecentAddedList();
    });

    recentAddedList.appendChild(item);
  });
}

/**
 * Salva tutti i piatti accumulati su MongoDB
 */
async function saveMenuToDatabase() {
  if (!currentRestaurantId) {
    showAlert("danger", "Attenzione", "Sessione non valida");
    return;
  }

  if (recentlyAddedMeals.length === 0) {
    showAlert("danger", "Attenzione", "Nessun piatto presente nella lista da salvare");
    return;
  }

  const saveBtn = document.getElementById("btnSaveEntireMenu");
  const originalText = saveBtn ? saveBtn.innerHTML : "";
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Salvataggio in corso...`;
  }

  try {
    for (const item of recentlyAddedMeals) {
      if (!item.ingredients || item.ingredients.length === 0) {
        return showAlert("danger", "Attenzione", "I piatti devono contenere almeno 1 ingrediente");
      }

      const payload = {
        restaurantId: currentRestaurantId,
        mealId: item.mealId || null,
        nameMeal: item.nameMeal,
        category: item.category || "Altro",
        price: item.price,
        image: item.image || "/assets/defaultMeal.jpeg",
        ingredients: item.ingredients
      };
      await createProduct(payload);
    }

    recentlyAddedMeals.length = 0;
    renderRecentAddedList();

    // Chiude l'offcanvas destro
    const offcanvasEl = document.getElementById("offcanvasRecentAdded");
    const offcanvasInst = bootstrap.Offcanvas.getInstance(offcanvasEl);
    if (offcanvasInst) offcanvasInst.hide();

    showAlert("success", "Prodotto salvato nel menù");

    // Notifica all'orchestratore di ricaricare il menù effettivo
    if (typeof onMenuSavedSuccessCallback === "function") {
      onMenuSavedSuccessCallback();
    }

  } catch (error) {
    console.error("Errore salvataggio menù:", error);
    showAlert("danger", "Attenzione", error);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }
}