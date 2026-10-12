// public/utils/restaurateur/menu.js
import { getStoredUser } from "/utils/common/session.js";
import { getRestaurantProducts, updateProduct } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";
import { getProductModalMarkup } from "/components/productModal.js";
import { initProductModal, openCustomizeModalForEdit } from "/utils/restaurateur/productModal.js";

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
const btnResetAllDiscounts = document.getElementById("btnResetAllDiscounts");
const btnDisableAllProducts = document.getElementById("btnDisableAllProducts");

document.addEventListener("DOMContentLoaded", async () => {
  const user = getStoredUser();
  const restaurantId = user?._id || user?.id;

  if (!restaurantId) {
    showAlert("danger", "Attenzione", "Sessione non valida o scaduta");
    setTimeout(() => { window.location.href = "/pages/common/login.html"; }, 1500);
    return;
  }

  let debounceTimer = null;
  searchInput?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 300);
  });

  categorySelect?.addEventListener("change", applyFilters);
  statusSelect?.addEventListener("change", applyFilters);

  btnResetAllDiscounts?.addEventListener("click", handleResetAllDiscounts);
  btnDisableAllProducts?.addEventListener("click", handleDisableAllProducts);

  // Iniezione e inizializzazione Modale Prodotto
  const modalContainer = document.getElementById("customizeMealModal");
  if (modalContainer) {
    modalContainer.innerHTML = getProductModalMarkup();
  }

  initProductModal({
    modalId: "customizeMealModal",
    onSubmitProduct: async (updatedData) => {
      try {
        // updatedData contiene: { nameMeal, category, price, image, ingredients }
        await updateProduct(currentEditingProductId, {
          nameMeal: updatedData.nameMeal,
          category: updatedData.category,
          price: updatedData.price,
          image: updatedData.image,
          ingredients: updatedData.ingredients,
          mealId: updatedData.mealId
        });

        // Aggiorna lo stato in memoria locale
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
    showAlert("danger", "Attenzione", err.message || "Errore durante il caricamento del menù", "danger");
  } finally {
    scrollSpinner?.classList.add("d-none");
  }
}

function sortMenuProducts(products) {
  const getRank = (p) => {
    if ((p.discount || 0) > 0 && p.available) return 1; // 1: In sconto (e disponibile)
    if (p.available) return 2;                          // 2: In menù
    return 3;                                           // 3: Fuori menù
  };

  return [...products].sort((a, b) => {
    const rankDiff = getRank(a) - getRank(b);
    if (rankDiff !== 0) return rankDiff;
    // A parità di categoria di stato, ordinamento alfabetico per nome
    return (a.nameMeal || "").localeCompare(b.nameMeal || "");
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

  // Se il browser supporta le View Transitions, interpola dolcemente le card
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
    fragment.appendChild(createMenuCardElement(product));
  });

  cardsContainer.appendChild(fragment);
  renderedCount += nextBatch.length;

  if (renderedCounterEl) {
    renderedCounterEl.textContent = `Visualizzati ${renderedCount} di ${filteredProducts.length} piatti`;
  }
}

function createMenuCardElement(product) {
  const col = document.createElement("div");
  col.className = "col";
  col.dataset.productId = product._id;

  const isAvailable = Boolean(product.available);
  const discountVal = Number(product.discount) || 0;
  const basePrice = Number(product.price) || 0;
  const hasDiscount = discountVal > 0;
  const finalPrice = hasDiscount ? (basePrice - (basePrice * discountVal / 100)).toFixed(2) : basePrice.toFixed(2);

  // Badge di stato testuale
  let statusBadgeMarkup = "";
  if (hasDiscount && isAvailable) {
    statusBadgeMarkup = `<span class="badge-status-pill status-discount"><i class="bi bi-tag-fill me-1"></i>In Offerta</span>`;
  } else if (isAvailable) {
    statusBadgeMarkup = `<span class="badge-status-pill status-active"><i class="bi bi-check-circle-fill me-1"></i>In Menù</span>`;
  } else {
    statusBadgeMarkup = `<span class="badge-status-pill status-inactive"><i class="bi bi-dash-circle me-1"></i>Fuori Menù</span>`;
  }

  col.innerHTML = `
    <div class="card h-100 menu-item-card-modern ${!isAvailable ? 'is-unavailable' : ''}">
      
      <!-- Immagine con badge -->
      <div class="menu-item-img-wrapper">
        <img src="${product.image || '/assets/defaultMeal.jpeg'}" 
             class="w-100 h-100 object-fit-cover" 
             alt="${product.nameMeal}">
        
        <div class="position-absolute top-0 start-0 m-2">
          ${statusBadgeMarkup}
        </div>

        ${hasDiscount ? `
          <div class="position-absolute top-0 end-0 m-2 discount-circle-badge">
            -${discountVal}%
          </div>
        ` : ''}
      </div>

      <div class="card-body d-flex flex-column p-3">
        <!-- Categoria & Titolo -->
        <span class="badge align-self-start mb-2 px-2 py-1 small menu-item-category-badge">
          ${product.category || 'Altro'}
        </span>
        
        <h5 class="card-title fw-bold mb-1 text-truncate text-white" title="${product.nameMeal}">
          ${product.nameMeal}
        </h5>
        
        <!-- Ingredienti -->
        <p class="card-text small flex-grow-1 text-truncate-2 mb-3 menu-item-ingredients">
          ${Array.isArray(product.ingredients) ? product.ingredients.join(", ") : ""}
        </p>

        <!-- Blocco Prezzo -->
        <div class="d-flex align-items-baseline gap-2 mb-1">
          ${hasDiscount ? `
            <span class="small menu-price-original">€${basePrice.toFixed(2)}</span>
            <span class="fs-4 fw-bold menu-price-discounted">€${finalPrice}</span>
          ` : `
            <span class="fs-4 fw-bold text-white">€${basePrice.toFixed(2)}</span>
          `}
        </div>
      </div>

      <!-- Dock di Controllo in Basso -->
      <div class="menu-card-dock">
        <!-- Bottone Disponibilità Interattivo -->
        <button type="button" class="btn-availability-pill ${isAvailable ? 'is-active' : ''} availability-toggle-btn" title="Clicca per cambiare disponibilità">
          <span class="d-flex align-items-center gap-2">
            <i class="bi ${isAvailable ? 'bi-toggle-on text-success fs-5' : 'bi-toggle-off text-secondary fs-5'}"></i>
            <span>${isAvailable ? 'In Menù: Clicca per disattivare' : 'Fuori Menù: Clicca per attivare'}</span>
          </span>
          <span class="status-indicator-dot"></span>
        </button>

        <!-- Riga Gestione Sconto -->
        <div class="discount-dock-row">
          <div class="discount-field-wrapper">
            <input name="discountInput" type="number" min="0" max="100" class="form-control menu-search-input text-center discount-input "value="${discountVal}" placeholder="0">
            <span class="discount-percent-symbol">%</span>
          </div>
          <button class="btn btn-amber btn-save-discount save-discount-btn" type="button" title="Applica sconto">
            <i class="bi bi-check-lg me-1"></i>Salva
          </button>
        </div>
      </div>

    </div>
  `;

  // Listener Toggle Disponibilità
  const availabilityBtn = col.querySelector(".availability-toggle-btn");
  availabilityBtn?.addEventListener("click", async () => {
    const newStatus = !product.available;
    await handleAvailabilityChange(product._id, newStatus, col);
  });

  // Listener Salvataggio Sconto
  const discountBtn = col.querySelector(".save-discount-btn");
  const discountInp = col.querySelector(".discount-input");
  discountBtn?.addEventListener("click", async () => {
    const val = parseInt(discountInp.value, 10) || 0;
    if (!Number.isInteger(val) || val > 100 || val < 0) return showAlert("danger", "Attenzione", "Inserire uno sconto valido [0,100]")
    await handleDiscountChange(product._id, val);
  });

  // 1. Click sull'intera card per aprire la modale
  const cardElement = col.querySelector(".menu-item-card-modern");
  cardElement?.addEventListener("click", () => {
    currentEditingProductId = product._id; // 👈 Salva l'ID MongoDB del piatto aperto
    openCustomizeModalForEdit(product);
  });

  // 2. Blocca la propagazione dei click sul dock comandi (switch e sconto)
  // per evitare che interagire con la disponibilità o lo sconto apra la modale
  const dock = col.querySelector(".menu-card-dock");
  dock?.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  return col;
}

async function handleAvailabilityChange(productId, isAvailable, cardCol) {
  try {
    await updateProduct(productId, { available: isAvailable });
    const prod = allProducts.find((p) => p._id === productId);
    if (prod) {
      prod.available = isAvailable;
      if(prod.available) showAlert("success", "Piatto inserito nel menù");
      else showAlert("danger", "Piatto escluso dal menù");
    } 

    updateCounters(allProducts);
    applyFilters();
  } catch (err) {
    showAlert( "danger", "Attenzione", err.message || "Errore aggiornamento disponibilità");
    const toggle = cardCol.querySelector(".availability-toggle");
    if (toggle) toggle.checked = !isAvailable;
  }
}

async function handleDiscountChange(productId, discount) {
  try {
    await updateProduct(productId, { discount : discount });
    const prod = allProducts.find((p) => p._id === productId);
    if (prod) prod.discount = discount;

    showAlert("success", "Percentuale di sconto applicata!");
    updateCounters(allProducts);
    applyFilters();
  } catch (err) {
    showAlert( "danger", "Attenzione", err.message || "Errore salvataggio sconto");
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
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  if (!categorySelect) return;
  categorySelect.innerHTML = '<option value="">Tutte le categorie</option>';
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    cat = String(cat).charAt(0).toUpperCase() + String(cat).slice(1).toLowerCase();
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

// Variabili di timer e stato per la conferma inline
let resetDiscountTimer = null;
let disableAllTimer = null;

/**
 * Azzera la percentuale di sconto con conferma a doppio click
 */
async function handleResetAllDiscounts() {
  const discountedProducts = allProducts.filter((p) => (p.discount || 0) > 0);
  if (discountedProducts.length === 0) {
    showAlert("danger", "Nessun piatto ha sconti attivi al momento");
    return;
  }

  // 1. Primo click: attiva la fase di conferma visiva
  if (!btnResetAllDiscounts.classList.contains("is-confirming-discount")) {
    btnResetAllDiscounts.classList.add("is-confirming-discount");
    btnResetAllDiscounts.innerHTML = `<i class="bi bi-question-circle-fill"></i> Confermi azzeramento?`;

    // Timeout di ripristino automatico dopo 4 secondi se non riclicca
    resetDiscountTimer = setTimeout(() => {
      btnResetAllDiscounts.classList.remove("is-confirming-discount");
      btnResetAllDiscounts.innerHTML = `<i class="bi bi-tag"></i> Annulla tutti gli sconti`;
    }, 4000);
    return;
  }

  // 2. Secondo click (confermato): esegue l'operazione
  clearTimeout(resetDiscountTimer);
  btnResetAllDiscounts.classList.remove("is-confirming-discount");
  btnResetAllDiscounts.innerHTML = `<i class="bi bi-tag"></i> Annulla tutti gli sconti`;

  try {
    btnResetAllDiscounts.disabled = true;

    await Promise.all(
      discountedProducts.map((p) => updateProduct(p._id, { discount: 0 }))
    );

    discountedProducts.forEach((p) => {
      p.discount = 0;
    });

    showAlert("success", "Tutti gli sconti sono stati annullati con successo!");
    updateCounters(allProducts);
    applyFilters();
  } catch (err) {
    showAlert("danger", err.message || "Errore durante l'azzeramento degli sconti");
  } finally {
    btnResetAllDiscounts.disabled = false;
  }
}

/**
 * Rende non disponibili tutti i piatti con conferma a doppio click
 */
async function handleDisableAllProducts() {
  const availableProducts = allProducts.filter((p) => p.available === true);
  if (availableProducts.length === 0) {
    showAlert("danger", "Tutti i piatti sono già fuori menù");
    return;
  }

  // 1. Primo click: attiva la fase di conferma visiva
  if (!btnDisableAllProducts.classList.contains("is-confirming-disable")) {
    btnDisableAllProducts.classList.add("is-confirming-disable");
    btnDisableAllProducts.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Confermi disattivazione?`;

    disableAllTimer = setTimeout(() => {
      btnDisableAllProducts.classList.remove("is-confirming-disable");
      btnDisableAllProducts.innerHTML = `<i class="bi bi-eye-slash"></i> Rendi tutto non disponibile`;
    }, 4000);
    return;
  }

  // 2. Secondo click (confermato): esegue l'operazione
  clearTimeout(disableAllTimer);
  btnDisableAllProducts.classList.remove("is-confirming-disable");
  btnDisableAllProducts.innerHTML = `<i class="bi bi-eye-slash"></i> Rendi tutto non disponibile`;

  try {
    btnDisableAllProducts.disabled = true;

    await Promise.all(
      availableProducts.map((p) => updateProduct(p._id, { available: false }))
    );

    availableProducts.forEach((p) => {
      p.available = false;
    });

    showAlert("success", "Tutti i piatti sono stati impostati come non disponibili");
    updateCounters(allProducts);
    applyFilters();
  } catch (err) {
    showAlert("danger", err.message || "Errore durante la disattivazione dei piatti");
  } finally {
    btnDisableAllProducts.disabled = false;
  }
}