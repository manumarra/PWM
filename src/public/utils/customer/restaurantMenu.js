import { getRestaurantById } from "/services/userService.js";
import { getRestaurantProducts } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";
import { createMenuCardElement } from "/utils/restaurateur/menuCards.js";
import { sortMenuProducts, updateCounters } from "/utils/common/menuShared.js";
import { initCart, addToCart } from "/utils/customer/cart.js";
import { getCustomerCartMarkup } from "/components/cart.js";

const heroSection = document.getElementById("restaurantHero");
const heroSpinner = document.getElementById("heroSpinner");
const bgImg = document.getElementById("heroBgImage");
const nameLabel = document.getElementById("restaurantNameLabel");
const addressLabel = document.getElementById("restaurantAddressLabel");
const phoneLabel = document.getElementById("restaurantPhoneLabel");
const menuCardsContainer = document.getElementById("menuCardsContainer");

// Elementi Filtro
const searchInput = document.getElementById("menuSearchInput");
const categorySelect = document.getElementById("menuCategorySelect");
const statusSelect = document.getElementById("menuStatusSelect");
const renderedCounterEl = document.getElementById("renderedCounter");

// Variabili di stato
let allProducts = [];
let filteredProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get("restaurantId");
  const cartMountPoint = document.getElementById("cartMountPoint");

  if (!restaurantId) {
    showAlert("danger", "Attenzione", "Nessun ristorante selezionato");
    setTimeout(() => { window.location.href = "/pages/customer/home.html"; }, 1500);
    return;
  }

  // Event Listeners per i filtri
  let debounceTimer = null;
  searchInput?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 300);
  });
  categorySelect?.addEventListener("change", applyFilters);
  statusSelect?.addEventListener("change", applyFilters);

  if (cartMountPoint) cartMountPoint.innerHTML = getCustomerCartMarkup();

  await loadRestaurantDetails(restaurantId);
});

async function loadRestaurantDetails(restaurantId) {
    heroSpinner?.classList.remove("d-none");

    const response = await getRestaurantById(restaurantId);
    const restaurant = response?.data;

    if (!restaurant || !response) {
      throw new Error("Ristorante non disponibile");
    }
    initCart(restaurant);

    if (bgImg) {
      const imgSrc = restaurant.image || "/assets/sfondoCibi.jpg";
      bgImg.style.backgroundImage = `url('${imgSrc}')`;
    }

    if (nameLabel) nameLabel.textContent = restaurant.name || "Ristorante";
    if (addressLabel && restaurant.address) addressLabel.textContent = `${restaurant.address.street || ""}, ${restaurant.address.city || ""}`;
    if (phoneLabel) phoneLabel.textContent = restaurant.phone || "Non disponibile";

    heroSection?.classList.remove("d-none");
    heroSpinner?.classList.add("d-none");
    
    await fetchAndLoadProducts(restaurantId);
}

async function fetchAndLoadProducts(restaurantId) {
    const response = await getRestaurantProducts(restaurantId);
    allProducts = response?.data || [];

    populateCategories(allProducts);
    updateCounters(allProducts);
    applyFilters();
}

function applyFilters() {
  const query = searchInput?.value.trim().toLowerCase() || "";
  const selectedCat = categorySelect?.value || "";
  const selectedStatus = statusSelect?.value || "all";

  filteredProducts = allProducts.filter((p) => {
    const matchName = (p.nameMeal || "").toLowerCase().includes(query);

    const matchCat = !selectedCat || String(p.category || "").trim().toLowerCase() === String(selectedCat).trim().toLowerCase();

    let matchStatus = true;

    if (selectedStatus === "available") {
      matchStatus = p.available === true;
    } else if (selectedStatus === "unavailable") {
      matchStatus = !p.available;
    } else if (selectedStatus === "discounted") {
      matchStatus = (p.discount || 0) > 0;
    }

    return matchName && matchCat && matchStatus;
  });

  filteredProducts = sortMenuProducts(filteredProducts);
  renderMenuCards();
}

function renderMenuCards() {
    if (!menuCardsContainer) return;
    if(filteredProducts.length === 0) {
        menuCardsContainer.className = "p-3";
        menuCardsContainer.innerHTML = `<div class="menu-empty-msg w-100 text-center">Nessun piatto trovato con i filtri selezionati.</div>`;
        if (renderedCounterEl) renderedCounterEl.textContent = "";
        return;
    }
    
    menuCardsContainer.className = "row row-cols-1 row-cols-md-2 g-4 mb-5";
    menuCardsContainer.innerHTML = "";

    const fragment = document.createDocumentFragment();

    filteredProducts.forEach((product) => {
        const col = createMenuCardElement(product, {
            isCustomerView: true,
            onCardClick: (p) => {
                if(!p.available) {
                   return showAlert("danger", "Attenzione", "Questo piatto al momento è esaurito.");
                }
                // CHIAMIAMO LA FUNZIONE DEL CARRELLO
                addToCart(p);
            }
        });
        fragment.appendChild(col);
    });

    menuCardsContainer.appendChild(fragment);

    if (renderedCounterEl) {
        renderedCounterEl.textContent = `${filteredProducts.length} ${filteredProducts.length === 1 ? 'piatto trovato' : 'piatti trovati'}`;
    }
}

function populateCategories(products) {
  const formatCat = (c) => String(c).trim().charAt(0).toUpperCase() + String(c).trim().slice(1).toLowerCase();
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean).map(formatCat))].sort();

  if (!categorySelect) return;
  
  categorySelect.innerHTML = '<option value="">Tutte le categorie</option>';
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}