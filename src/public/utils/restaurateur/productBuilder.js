import { getStoredUser } from "/utils/common/session.js";

// Modulo Catalogo
import { initMealCatalog, fetchCatalogPage, updateCatalogFilters } from "/utils/restaurateur/mealCatalog.js";

// Modulo Modale Prodotto
import { getProductModalMarkup } from "/components/productModal.js";
import { initProductModal, openCustomizeModal, openCreateNewMealModal, openCustomizeModalForEdit } from "/utils/restaurateur/productModal.js";

// Modulo Offcanvas Sinistro ("I Tuoi Prodotti")
import { getCurrentProductsOffcanvasMarkup, getDeleteMenuConfirmModalMarkup } from "/components/currentProductsOffcanvas.js";
import { initCurrentProductsOffcanvas, loadCurrentRestaurantMenu } from "/utils/restaurateur/currentProductsOffcanvas.js";

// Modulo Offcanvas Destro ("Aggiunti di Recente")
import { getRecentAddedOffcanvasMarkup } from "/components/recentAddedOffcanvas.js";
import { initRecentAddedOffcanvas, addOrUpdateRecentMeal } from "/utils/restaurateur/recentAddedOffcanvas.js";

document.addEventListener("DOMContentLoaded", () => {
  const user = getStoredUser();
  const restaurantId = user?._id;

  // 1. Iniezione Componenti HTML
  const modalContainer = document.getElementById("customizeMealModal");
  if (modalContainer) modalContainer.innerHTML = getProductModalMarkup();

  const leftOffcanvasContainer = document.getElementById("offcanvasCurrentMenu");
  if (leftOffcanvasContainer) leftOffcanvasContainer.innerHTML = getCurrentProductsOffcanvasMarkup();

  const confirmModalContainer = document.getElementById("deleteAllMenuConfirmModal");
  if (confirmModalContainer) confirmModalContainer.innerHTML = getDeleteMenuConfirmModalMarkup();

  const rightOffcanvasContainer = document.getElementById("offcanvasRecentAdded");
  if (rightOffcanvasContainer) rightOffcanvasContainer.innerHTML = getRecentAddedOffcanvasMarkup();
  

  // 2. Inizializzazione Modale Prodotto
  initProductModal({
    modalId: "customizeMealModal",
    onSubmitProduct: (productData, editingIndex) => {
      // Quando il form della modale viene inviato, aggiunge o aggiorna nel carrello temporaneo
      addOrUpdateRecentMeal(productData, editingIndex);
    }
  });

  // 3. Inizializzazione Offcanvas Sinistro ("I Tuoi Prodotti")
  initCurrentProductsOffcanvas(restaurantId);

  // 4. Inizializzazione Offcanvas Destro ("Aggiunti di Recente")
  initRecentAddedOffcanvas({
    restaurantId,
    onEditProduct: (product, index) => {
      openCustomizeModalForEdit(product, index);
    },
    onMenuSaved: () => {
      // Quando i piatti vengono salvati nel DB, aggiorna automaticamente la lista a sinistra
      loadCurrentRestaurantMenu();
    }
  });

  // 5. Inizializzazione Catalogo Ricette
  initMealCatalog({
    gridEl: document.getElementById("mealsGrid"),
    emptyEl: document.getElementById("emptyState"),
    paginationEl: document.getElementById("paginationContainer"),
    onMealClick: (meal) => openCustomizeModal(meal)
  });

  fetchCatalogPage(1);

  // 6. Barra di Ricerca e Categorie
  const searchInput = document.getElementById("searchInput");
  let debounceTimeout = null;
  searchInput?.addEventListener("input", (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      updateCatalogFilters({ search: e.target.value.trim() });
    }, 350);
  });

  const categorySelect = document.getElementById("categorySelect");
  const customCatContainer = document.getElementById("customCategoryContainer");
  const customCatInput = document.getElementById("customCategoryInput");

  categorySelect?.addEventListener("change", (e) => {
    const selectedVal = e.target.value;
    if (selectedVal === "custom") {
      customCatContainer?.classList.remove("d-none");
      customCatInput?.focus();
      updateCatalogFilters({ category: customCatInput?.value.trim() || "" });
    } else {
      customCatContainer?.classList.add("d-none");
      if (customCatInput) customCatInput.value = "";
      updateCatalogFilters({ category: selectedVal });
    }
  });

  customCatInput?.addEventListener("input", (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      updateCatalogFilters({ category: e.target.value.trim() });
    }, 350);
  });

  // 7. Pulsante "Crea Nuovo Piatto"
  document.getElementById("btnCreateNewMeal")?.addEventListener("click", () => {
    openCreateNewMealModal();
  });
});