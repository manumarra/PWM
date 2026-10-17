import { getRestaurantById } from "/services/userService.js";
import { getRestaurantProducts } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";
import { createMenuCardElement } from "/utils/restaurateur/menuCards.js";

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
const countAvailableEl = document.getElementById("countAvailable");
const countUnavailableEl = document.getElementById("countUnavailable");
const countDiscountedEl = document.getElementById("countDiscounted");
const renderedCounterEl = document.getElementById("renderedCounter");

// Referenze DOM del carrello
const cartItemsContainer = document.getElementById("cartItemsContainer");
const emptyCartMsg = document.getElementById("emptyCartMsg");
const cartTotalPrice = document.getElementById("cartTotalPrice");
const checkoutBtn = document.getElementById("checkoutBtn");
const emptyCartBtn = document.getElementById("emptyCartBtn");

// Variabili di stato
let allProducts = [];
let filteredProducts = [];
let cart = [];

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get("restaurantId");

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

  await loadRestaurantDetails(restaurantId);
});

async function loadRestaurantDetails(restaurantId) {
    heroSpinner?.classList.remove("d-none");

    const response = await getRestaurantById(restaurantId);
    const restaurant = response?.data;

    if (!restaurant || !response) {
      throw new Error("Ristorante non disponibile");
    }

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

function updateCounters(products) {
  const availableCount = products.filter((p) => p.available).length;
  const unavailableCount = products.length - availableCount;
  const discountedCount = products.filter((p) => ((p.discount && p.available) || 0) > 0).length;

  if (countAvailableEl) countAvailableEl.textContent = availableCount;
  if (countUnavailableEl) countUnavailableEl.textContent = unavailableCount;
  if (countDiscountedEl) countDiscountedEl.textContent = discountedCount;
}

function addToCart(product) {
  // Controlla se il piatto è già nel carrello
  const existingItem = cart.find(item => item.product._id === product._id);
  
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ product: product, qty: 1 });
  }

  showAlert("success", "Carrello", `${product.nameMeal} aggiunto al tuo ordine!`);
  updateCartUI();
}

function changeCartQuantity(productId, delta) {
  const item = cart.find(item => item.product._id === productId);
  if (!item) return;

  item.qty += delta;

  // Se la quantità scende a 0 o meno, rimuovilo dal carrello
  if (item.qty <= 0) {
    cart = cart.filter(i => i.product._id !== productId);
  }

  updateCartUI();
}

function updateCartUI() {
  if (!cartItemsContainer) return;
  
  // Svuotiamo il contenitore dei piatti
  cartItemsContainer.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    // Carrello vuoto: disabilita entrambi i pulsanti
    cartItemsContainer.appendChild(emptyCartMsg);
    if (checkoutBtn) checkoutBtn.disabled = true;
    if(emptyCartMsg) emptyCartMsg.classList.remove("d-none");
    if (emptyCartBtn) emptyCartBtn.classList.add("d-none");
  } else {
    // Ci sono piatti nel carrello: abilita i pulsanti
    emptyCartMsg.classList.add("d-none");
    if (checkoutBtn) checkoutBtn.disabled = false;
    if (emptyCartBtn) emptyCartBtn.classList.remove("d-none")

    cart.forEach(item => {
      const p = item.product;
      const basePrice = Number(p.price) || 0;
      const discountVal = Number(p.discount) || 0;
      const finalPrice = discountVal > 0 ? basePrice - (basePrice * discountVal / 100) : basePrice;

      total += finalPrice * item.qty;

      const row = document.createElement("div");
      row.className = "d-flex justify-content-between align-items-center bg-light p-2 rounded";
      
      row.innerHTML = `
        <div class="d-flex flex-column cart-product">
          <span class="fw-semibold text-truncate small" title="${p.nameMeal}">${p.nameMeal}</span>
          <span class="text-secondary small">€${(item.qty*finalPrice).toFixed(2)}</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary px-2 py-0 fw-bold btn-decrease" data-id="${p._id}">-</button>
          <span class="fw-bold small px-1">${item.qty}</span>
          <button class="btn btn-sm btn-outline-secondary px-2 py-0 fw-bold btn-increase" data-id="${p._id}">+</button>
        </div>
      `;

      // Eventi pulsanti + e -
      row.querySelector(".btn-decrease").addEventListener("click", () => changeCartQuantity(p._id, -1));
      row.querySelector(".btn-increase").addEventListener("click", () => changeCartQuantity(p._id, 1));

      cartItemsContainer.appendChild(row);
    });
  }

  // Aggiorna il totale stampato
  if (cartTotalPrice) {
    cartTotalPrice.textContent = total.toFixed(2);
  }
}

// Listener per svuotare il carrello
emptyCartBtn?.addEventListener("click", () => {
  if (cart.length === 0) return;
    cart = []; // Svuota l'array
    updateCartUI(); // Ridisegna l'interfaccia
    showAlert("danger", "Carrello svuotato", "Tutti i piatti sono stati rimossi.");
  }
);