// public/utils/restaurateur/menu.js
import { getStoredUser } from "/utils/common/session.js";
import { getRestaurantProducts, updateProduct } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";
import { getProductModalMarkup } from "/components/productModal.js";
import { initProductModal, openCustomizeModalForEdit, updateModalCategories } from "/utils/restaurateur/productModal.js";

import { createMenuCardElement } from "/utils/restaurateur/menuCards.js";
import { initMenuMassActions } from "/utils/restaurateur/menuActions.js";

let allProducts = [];
let filteredProducts = [];
let currentEditingProductId = null;
let renderedCount = 0;
const BATCH_SIZE = 12;

const cardsContainer = document.getElementById("menuCardsContainer");
const emptyMessage = document.getElementById("emptyMenuMessage");
const scrollSentinel = document.getElementById("scrollSentinel");
const scrollSpinner = document.getElementById("scrollSpinner");
const searchInput = document.getElementById("menuSearchInput");
const categorySelect = document.getElementById("menuCategorySelect");
const statusSelect = document.getElementById("menuStatusSelect");
const countAvailableEl = document.getElementById("countAvailable");
const countUnavailableEl = document.getElementById("countUnavailable");
const countDiscountedEl = document.getElementById("countDiscounted");
const renderedCounterEl = document.getElementById("renderedCounter");

document.addEventListener("DOMContentLoaded", async () => {
  const user = getStoredUser();
  const restaurantId = user?._id || user?.id;

  if (!restaurantId) {
    showAlert("danger", "Attenzione", "Sessione non valida o scaduta");
    setTimeout(() => { window.location.href = "/pages/common/login.html"; }, 1500);
    return;
  }

  // 1. Azioni massive summary bar
  initMenuMassActions({
    getProducts: () => allProducts,
    onComplete: () => {
      updateCounters(allProducts);
      applyFilters();
    }
  });

  // 2. Modale personalizzazione piatto
  const modalContainer = document.getElementById("customizeMealModal");
  if (modalContainer) modalContainer.innerHTML = getProductModalMarkup();

  initProductModal({
    modalId: "customizeMealModal",
    onSubmitProduct: async (updatedData) => {
      try {
        await updateProduct(currentEditingProductId, {
          nameMeal: updatedData.nameMeal,
          category: updatedData.category,
          price: updatedData.price,
          image: updatedData.image,
          ingredients: updatedData.ingredients,
          mealId: updatedData.mealId
        });

        const index = allProducts.findIndex(p => p._id === currentEditingProductId);
        if (index !== -1) {
          allProducts[index] = { ...allProducts[index], ...updatedData };
        }

        showAlert("success", "Piatto aggiornato con successo!");
        applyFilters();
        populateCategories(allProducts);
      } catch (err) {
        showAlert("danger", err.message || "Errore durante il salvataggio delle modifiche");
      }
    }
  });

  // 3. Listener filtri con debounce
  let debounceTimer = null;
  searchInput?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 300);
  });
  categorySelect?.addEventListener("change", applyFilters);
  statusSelect?.addEventListener("change", applyFilters);

  setupInfiniteScroll();
  await loadMenu(restaurantId);
});

async function loadMenu(restaurantId) {
  try {
    scrollSpinner?.classList.remove("d-none");
    const response = await getRestaurantProducts(restaurantId);
    allProducts = response?.data || [];

    populateCategories(allProducts);
    updateCounters(allProducts);
    applyFilters();
  } catch (err) {
    showAlert("danger", "Attenzione", err.message || "Errore durante il caricamento del menù");
  } finally {
    scrollSpinner?.classList.add("d-none");
  }
}

function sortMenuProducts(products) {
  const getRank = (p) => {
    if ((p.discount || 0) > 0 && p.available) return 1;
    if (p.available) return 2;
    return 3;
  };

  return [...products].sort((a, b) => {
    const diff = getRank(a) - getRank(b);
    return diff !== 0 ? diff : (a.nameMeal || "").localeCompare(b.nameMeal || "");
  });
}

function applyFilters() {
  const query = searchInput?.value.trim().toLowerCase() || "";
  const selectedCat = categorySelect?.value || "";
  const selectedStatus = statusSelect?.value || "all";

  filteredProducts = allProducts.filter((p) => {
    const matchName = (p.nameMeal || "").toLowerCase().includes(query);
    const matchCat = !selectedCat || p.category === selectedCat;

    let matchStatus = true;
    if (selectedStatus === "available") matchStatus = p.available === true;
    else if (selectedStatus === "unavailable") matchStatus = !p.available;
    else if (selectedStatus === "discounted") matchStatus = (p.discount || 0) > 0;

    return matchName && matchCat && matchStatus;
  });

  filteredProducts = sortMenuProducts(filteredProducts);

  const updateGridDOM = () => {
    cardsContainer.innerHTML = "";
    renderedCount = 0;

    if (filteredProducts.length === 0) {
      emptyMessage?.classList.remove("d-none");
      if (renderedCounterEl) renderedCounterEl.textContent = "";
    } else {
      emptyMessage?.classList.add("d-none");
      renderNextBatch();
    }
  };

  if (document.startViewTransition) {
    document.startViewTransition(() => updateGridDOM());
  } else {
    updateGridDOM();
  }
}

function renderNextBatch() {
  if (renderedCount >= filteredProducts.length) return;

  const nextBatch = filteredProducts.slice(renderedCount, renderedCount + BATCH_SIZE);
  const fragment = document.createDocumentFragment();

  nextBatch.forEach((product) => {
    const col = createMenuCardElement(product, {
      onCardClick: (p) => {
        currentEditingProductId = p._id;
        openCustomizeModalForEdit(p);
      },
      onProductUpdated: () => {
        updateCounters(allProducts);
        applyFilters();
      }
    });
    fragment.appendChild(col);
  });

  cardsContainer.appendChild(fragment);
  renderedCount += nextBatch.length;

  if (renderedCounterEl) {
    renderedCounterEl.textContent = `Visualizzati ${renderedCount} di ${filteredProducts.length} piatti`;
  }
}

function setupInfiniteScroll() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && renderedCount < filteredProducts.length) {
      renderNextBatch();
    }
  }, { rootMargin: "200px" });

  if (scrollSentinel) observer.observe(scrollSentinel);
}

function populateCategories(products) {
  const formatCat = (c) => String(c).trim().charAt(0).toUpperCase() + String(c).trim().slice(1).toLowerCase();
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean).map(formatCat))].sort();

  if (categorySelect) {
    categorySelect.innerHTML = '<option value="">Tutte le categorie</option>';
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }
  updateModalCategories(categories);
}

function updateCounters(products) {
  const availableCount = products.filter((p) => p.available).length;
  const unavailableCount = products.length - availableCount;
  const discountedCount = products.filter((p) => ((p.discount && p.available) || 0) > 0).length;

  if (countAvailableEl) countAvailableEl.textContent = availableCount;
  if (countUnavailableEl) countUnavailableEl.textContent = unavailableCount;
  if (countDiscountedEl) countDiscountedEl.textContent = discountedCount;
}