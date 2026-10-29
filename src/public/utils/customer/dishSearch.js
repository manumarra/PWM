import { searchProducts } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";
import { createMenuCardElement } from "/utils/restaurateur/menuCards.js";
import { escapeHtml, renderAllergenCheckboxes } from "/utils/common/dishUi.js";

const LIMIT = 12;

let currentPage = 1;
let hasNext = false;
let requestId = 0;
let avoidAllergens = [];

const el = (id) => document.getElementById(id);
const form = el("dishSearchForm");
const grid = el("dishResultsGrid");
const countLabel = el("dishCountLabel");
const emptyMsg = el("dishEmptyMsg");
const loadMoreBtn = el("loadMoreBtn");
const allergenList = el("allergenFilterList");
const allergenLabel = el("allergenFilterLabel");

function currentFilters() {
  return {
    search: el("fSearch").value.trim(),
    category: el("fCategory").value.trim(),
    city: el("fCity").value.trim(),
    minPrice: el("fMinPrice").value,
    maxPrice: el("fMaxPrice").value,
    ingredient: el("fIngredient").value.trim(),
    avoidAllergens: avoidAllergens.join(","),
    sort: el("fSort").value
  };
}

function updateAllergenLabel() {
  allergenLabel.textContent = avoidAllergens.length
    ? `Allergeni (${avoidAllergens.length})`
    : "Senza allergeni";
}

// Card del piatto + riga con il ristorante; il click porta al menù di quel ristorante
function createResultCard(product) {
  const goToRestaurant = () => {
    window.location.href = `/pages/customer/restaurantMenu.html?restaurantId=${encodeURIComponent(product.restaurantId)}`;
  };

  const col = createMenuCardElement(product, { isCustomerView: true, onCardClick: goToRestaurant });

  const restaurant = product.restaurant || {};
  const city = restaurant.address?.city ? ` · ${escapeHtml(restaurant.address.city)}` : "";
  col.querySelector(".card-body")?.insertAdjacentHTML("beforeend", `
    <div class="small mt-2 text-warning text-truncate">
      <i class="bi bi-shop me-1"></i>${escapeHtml(restaurant.name || "Ristorante")}${city}
    </div>
  `);

  const card = col.querySelector(".menu-item-card-modern");
  if (card) card.title = "Clicca per vedere il menù del ristorante";

  return col;
}

async function loadResults({ reset = false } = {}) {
  if (reset) {
    currentPage = 1;
    hasNext = false;
    grid.innerHTML = "";
  }

  const myRequest = ++requestId;
  loadMoreBtn.disabled = true;

  try {
    const res = await searchProducts({ ...currentFilters(), page: currentPage, limit: LIMIT });
    if (myRequest !== requestId) return; // c'è una ricerca più recente

    const products = res?.data || [];
    const pagination = res?.pagination || {};

    products.forEach((product) => grid.appendChild(createResultCard(product)));

    const total = pagination.total ?? products.length;
    countLabel.textContent = `${total} ${total === 1 ? "piatto trovato" : "piatti trovati"}`;
    emptyMsg.classList.toggle("d-none", total > 0);

    hasNext = Boolean(pagination.hasNext);
    currentPage = (pagination.page || currentPage) + 1;
  } catch (error) {
    if (myRequest === requestId) {
      countLabel.textContent = "";
      showAlert("danger", "Attenzione", error.message || "Errore nella ricerca dei piatti");
    }
  } finally {
    if (myRequest === requestId) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.classList.toggle("d-none", !hasNext);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderAllergenCheckboxes(allergenList, (selected) => {
    avoidAllergens = selected;
    updateAllergenLabel();
  });

  // Ricerca automatica con debounce quando cambia un filtro
  let debounceTimer = null;
  const scheduleSearch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadResults({ reset: true }), 400);
  };
  form.addEventListener("input", scheduleSearch);
  form.addEventListener("change", scheduleSearch);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearTimeout(debounceTimer);
    loadResults({ reset: true });
  });

  el("resetFiltersBtn").addEventListener("click", () => {
    form.reset();
    avoidAllergens = [];
    updateAllergenLabel();
    clearTimeout(debounceTimer);
    loadResults({ reset: true });
  });

  loadMoreBtn.addEventListener("click", () => loadResults());

  loadResults({ reset: true });
});