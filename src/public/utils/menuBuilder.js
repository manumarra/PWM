// public/utils/menuBuilder.js
import { getMeals } from "/services/mealService.js";
import { getStoredUser } from "/utils/session.js";
import { createProduct, getRestaurantProducts, deleteProduct, deleteAllProduct } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";

// Stato locale della pagina
let currentPage = 1;
const limit = 12;
let currentSearch = "";
let currentCategory = "";
let activeModalMeal = null;
const recentlyAddedMeals = [];
let currentIngredients = [];
let editingRecentIndex = null; // null = nuovo piatto; numero = indice del piatto da modificare

// Elementi del DOM
const mealsGrid = document.getElementById("mealsGrid");
const emptyState = document.getElementById("emptyState");
const paginationContainer = document.getElementById("paginationContainer");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const currentMenuList = document.getElementById("currentMenuList");
const recentAddedList = document.getElementById("recentAddedList");
const addedCountBadge = document.getElementById("addedCountBadge");
const customizeModalElement = document.getElementById("customizeMealModal");
const customCatContainer = document.getElementById("customCategoryContainer");
const customCatInput = document.getElementById("customCategoryInput");



document.addEventListener("DOMContentLoaded", () => {

    const user = getStoredUser();
    const restaurantId = user?._id;

    // 3. Carica il catalogo comune e il menù già salvato del ristoratore
    fetchCatalogPage(1);
    if (restaurantId) {
      loadCurrentRestaurantMenu(restaurantId);
    }

    // 3b. Ascolto del pulsante "Salva Menù" dell'Offcanvas destro
    const btnSaveEntireMenu = document.getElementById("btnSaveEntireMenu");
    btnSaveEntireMenu?.addEventListener("click", () => {
      saveMenuToDatabase(restaurantId);
    });

    // 4. Gestione ricerca con debounce
    let debounceTimeout = null;
    searchInput?.addEventListener("input", (event) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
        currentSearch = event.target.value.trim();
        fetchCatalogPage(1);
        }, 350);
    });

    // 5. Gestione cambio categoria
    categorySelect?.addEventListener("change", (event) => {
        currentCategory = event.target.value;
        fetchCatalogPage(1);
    });

    // 5. Gestione cambio categoria
    categorySelect?.addEventListener("change", (event) => {
        const selectedVal = event.target.value;

        if (selectedVal === "custom") {
            // Mostra l'input di testo per scrivere la categoria libera
            customCatContainer?.classList.remove("d-none");
            customCatInput?.focus();
            currentCategory = customCatInput?.value.trim() || "";
        } else {
            // Nasconde e svuota l'input libero se selezioni una categoria predefinita
            customCatContainer?.classList.add("d-none");
            if (customCatInput) customCatInput.value = "";
            currentCategory = selectedVal;
        }

        fetchCatalogPage(1);
    });

    // 5b. Gestione digitazione nella categoria personalizzata
    let customCatTimeout = null;
    customCatInput?.addEventListener("input", (event) => {
        clearTimeout(customCatTimeout);
        customCatTimeout = setTimeout(() => {
            currentCategory = event.target.value.trim();
            fetchCatalogPage(1);
        }, 350);
    });

    const customizeForm = document.getElementById("customizeProductForm");
    customizeForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const price = document.getElementById("modalMealPrice").value;
        const name = document.getElementById("modalMealName").value;

        const updatedProduct = {
            nameMeal: name,
            price: parseFloat(price),
            ingredients: [...currentIngredients],
            // Conserviamo i riferimenti originali per poterlo riaprire/modificare
            originalMeal: activeModalMeal
        };

        if (editingRecentIndex !== null) {
            // Modifica piatto esistente
            recentlyAddedMeals[editingRecentIndex] = updatedProduct;
            editingRecentIndex = null;
        } else {
            // Nuovo inserimento
            recentlyAddedMeals.unshift(updatedProduct);
        }

        renderRecentAddedList();

        // Chiude la modale recuperando l'istanza corretta
        const modalEl = document.getElementById("customizeMealModal");
        
        // Chiude la modale recuperando l'istanza corretta dal nodo già memorizzato
        const modalInst = bootstrap.Modal.getInstance(customizeModalElement);
        if (modalInst) modalInst.hide();
    });

});



/**
 * Recupera e renderizza i piatti dal catalogo comune
 */
async function fetchCatalogPage(page = 1) {
  try {
    currentPage = Number(page);
    mealsGrid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-warning" role="status"></div>
        <p class="text-secondary mt-2">Caricamento catalogo...</p>
      </div>`;

    const response = await getMeals({
      page: currentPage,
      limit,
      search: currentSearch,
      category: currentCategory
    });

    const meals = response.data || [];
    const pagination = response.pagination || {};

    if (meals.length === 0) {
      mealsGrid.innerHTML = "";
      emptyState.classList.remove("d-none");
      paginationContainer.innerHTML = "";
      return;
    }

    emptyState.classList.add("d-none");
    renderMealCards(meals);
    renderPagination(pagination);

  } catch (err) {
    console.error("Errore fetch catalog:", err);
    mealsGrid.innerHTML = `
      <div class="col-12 text-center text-danger py-4">
        Impossibile caricare i piatti. Riprova più tardi.
      </div>`;
  }
}

/**
 * Disegna le card centrali
 */
function renderMealCards(meals) {
  mealsGrid.innerHTML = "";

  meals.forEach(meal => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    col.innerHTML = `
      <div class="card h-100 menu-modal-content border-0 shadow-sm overflow-hidden meal-card-clickable" role="button" tabindex="0">
        <img src="${meal.image || '/assets/defaultMeal.jpeg'}" class="card-img-top" alt="${meal.nameMeal}" style="height: 190px; object-fit: cover;" onerror="this.src='/assets/defaultMeal.jpeg'">
        <div class="card-body d-flex flex-column justify-content-between p-3">
          <div>
            <h5 class="card-title text-white fw-bold mb-1 text-truncate" title="${meal.nameMeal}">${meal.nameMeal}</h5>
            <span class="badge bg-secondary mb-2">${meal.category || 'Altro'}</span>
            <p class="card-text text-secondary small mb-0">
              ${meal.ingredients && meal.ingredients.length > 0 ? meal.ingredients.slice(0, 4).join(", ") : "Ingredienti vari"}
            </p>
          </div>
        </div>
      </div>
    `;

    // L'evento click è ora agganciato direttamente alla card
    const cardElement = col.querySelector(".meal-card-clickable");
    cardElement.addEventListener("click", () => {
      openCustomizeModal(meal);
    });

    // Supporto accessibilità per aprire con tasto Invio da tastiera
    cardElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        openCustomizeModal(meal);
      }
    });

    mealsGrid.appendChild(col);
  });
}

/**
 * Disegna la barra di navigazione con numerazione
 */
function renderPagination(pagination) {
  paginationContainer.innerHTML = "";
  if (!pagination || pagination.pages <= 1) return;

  const current = Number(pagination.page);
  const totalPages = Number(pagination.pages); // numero di pagine calcolate: total/limit

  // Tasto Precedente
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${!pagination.hasPrev ? 'disabled' : ''}`;
  prevLi.innerHTML = `<button class="page-link menu-search-input">&laquo;</button>`;
  if (pagination.hasPrev) {
    prevLi.querySelector("button").addEventListener("click", (e) => {
      e.preventDefault();
      fetchCatalogPage(current - 1);
    });
  }
  paginationContainer.appendChild(prevLi);

  // Pagine numeriche
  let startPage = Math.max(1, current - 2);
  let endPage = Math.min(totalPages, current + 2);

  for (let i = startPage; i <= endPage; i++) {
    const numLi = document.createElement("li");
    const isActive = i === current;
    numLi.className = `page-item ${isActive ? 'active' : ''}`;
    numLi.innerHTML = `<button class="page-link ${isActive ? 'btn-amber text-white border-0' : 'menu-search-input'}">${i}</button>`;
    
    if (!isActive) {
      numLi.querySelector("button").addEventListener("click", (e) => {
        e.preventDefault();
        fetchCatalogPage(i);
      });
    }
    paginationContainer.appendChild(numLi);
  }

  // Tasto Successivo
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${!pagination.hasNext ? 'disabled' : ''}`;
  nextLi.innerHTML = `<button class="page-link menu-search-input">&raquo;</button>`;
  if (pagination.hasNext) {
    nextLi.querySelector("button").addEventListener("click", (e) => {
      e.preventDefault();
      fetchCatalogPage(current + 1);
    });
  }
  paginationContainer.appendChild(nextLi);
}

function openCustomizeModal(meal) {
    activeModalMeal = meal;
    editingRecentIndex = null;
    const mealTitle = meal.nameMeal || meal.strMeal || "";
    const mealImg = meal.image || meal.strMealThumb || "/assets/sfondoCibi.jpg";
    const mealCat = meal.category || meal.strCategory || "Altro";

    // Copia gli ingredienti del piatto corrente
    currentIngredients = [...(meal.ingredients || [])];

    // Popola campi testuali
    document.getElementById("modalMealName").value = mealTitle;
    document.getElementById("modalMealPrice").value = "";
    document.getElementById("modalMealCategory").textContent = mealCat;

    const imgEl = document.getElementById("modalMealImg");
    imgEl.src = mealImg;
    imgEl.alt = mealTitle;

    // Svuota l'input dell'ingrediente personalizzato
    const customInput = document.getElementById("customIngredientInput");
    if (customInput) customInput.value = "";

    // Disegna le pillole iniziali
    renderIngredientPills();

    // Mostra la modale
    const modalInst = bootstrap.Modal.getOrCreateInstance(customizeModalElement);
    modalInst.show();
}

/**
 * Renderizza le pillole nel contenitore
 */
function renderIngredientPills() {
  const container = document.getElementById("modalIngredientsList");
  if (!container) return;

  container.innerHTML = "";

  if (currentIngredients.length === 0) {
    container.innerHTML = `<span class="text-secondary small">Nessun ingrediente inserito.</span>`;
    return;
  }

  currentIngredients.forEach((ing, index) => {
    const pill = document.createElement("span");
    pill.className = "ingredient-pill";
    pill.innerHTML = `
      <span>${ing}</span>
      <button type="button" class="btn-remove-tag" aria-label="Rimuovi">&times;</button>
    `;

    // Click sulla "x" per rimuovere la pillola
    pill.querySelector(".btn-remove-tag").addEventListener("click", () => {
      currentIngredients.splice(index, 1);
      renderIngredientPills();
    });

    container.appendChild(pill);
  });
}

/**
 * Inserisce un nuovo ingrediente digitato dall'utente
 */
function addCustomIngredient() {
  const input = document.getElementById("customIngredientInput");
  if (!input) return;

  const newIng = input.value.trim();
  if (!newIng) return;

  // Evita duplicati identici
  if (!currentIngredients.includes(newIng)) {
    currentIngredients.push(newIng);
    renderIngredientPills();
  }

  input.value = "";
  input.focus();
}

// 1. Aggiunta nuovo ingrediente tramite click sul bottone
const btnAddIngredient = document.getElementById("btnAddIngredient");
  const customIngredientInput = document.getElementById("customIngredientInput");

  btnAddIngredient?.addEventListener("click", () => {
    addCustomIngredient();
  });

  // 2. Aggiunta nuovo ingrediente premendo Invio nel campo
  customIngredientInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomIngredient();
    }
});

/**
 * Renderizza i piatti nell'Offcanvas destro con supporto a click (modifica) e hover-delete (rimozione)
 */
function renderRecentAddedList() {
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
        
        const imgSrc = product.originalMeal?.image || product.image || "/assets/defaultMeal.jpeg";
        const catName = product.originalMeal?.category || product.category || "Altro";

        item.innerHTML = `
            <div class="d-flex align-items-center gap-2 text-truncate pe-2">
                <img 
                    src="${imgSrc}" width="42" height="42" class="rounded object-fit-cover" alt="${product.nameMeal}" onerror="this.src='/assets/defaultMeal.jpeg'">
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

        // 1. Click sulla riga: riapre la modale pre-compilata per modificare
        item.addEventListener("click", () => {
            editingRecentIndex = index;
            openCustomizeModalForEdit(product);
        });

        // 2. Click sul cestino (hover): rimuove il piatto
        const deleteBtn = item.querySelector(".btn-delete-recent");
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Impedisce al click di scatenare anche l'apertura della modale!
            recentlyAddedMeals.splice(index, 1);
            renderRecentAddedList();
        });

        recentAddedList.appendChild(item);
    });
}

/**
 * Apre la modale per modificare un piatto già aggiunto alla lista
 */
function openCustomizeModalForEdit(product) {
    activeModalMeal = product.originalMeal || { nameMeal: product.nameMeal, ingredients: product.ingredients };
    
    const mealTitle = product.nameMeal || activeModalMeal?.nameMeal || "";
    const mealPrice = product.price;
    const mealImg = activeModalMeal?.image || activeModalMeal?.image || "/assets/defaultMeal.jpeg";
    const mealCat = activeModalMeal?.category || activeModalMeal?.category || "Altro";

    // Ripristiniamo gli ingredienti salvati in questo prodotto
    currentIngredients = [...(product.ingredients || [])];

    document.getElementById("modalMealName").value = mealTitle;
    document.getElementById("modalMealPrice").value = mealPrice;
    document.getElementById("modalMealCategory").textContent = mealCat;

    const imgEl = document.getElementById("modalMealImg");
    imgEl.src = mealImg;
    imgEl.alt = mealTitle;

    const customInput = document.getElementById("customIngredientInput");
    if (customInput) customInput.value = "";

    renderIngredientPills();

    // Chiude l'offcanvas per dare spazio alla modale
    const offcanvasEl = document.getElementById("offcanvasRecentAdded");
    const offcanvasInst = bootstrap.Offcanvas.getInstance(offcanvasEl);
    if (offcanvasInst) offcanvasInst.hide();

    const modalInst = bootstrap.Modal.getOrCreateInstance(customizeModalElement);
    modalInst.show();
}

/**
 * Invia tutti i piatti collezionati in recentlyAddedMeals al backend
 */
async function saveMenuToDatabase(restaurantId) {
  if (!restaurantId) {
    alert("Sessione non valida. Riaccedi.");
    showAlert("danger", "Attenzione", "Sessione non valida")
    return;
  }

  if (recentlyAddedMeals.length === 0) {
    showAlert("danger", "Attenzione", "Nessun piatto presente nella lista da salvare" )
    return;
  }

  const saveBtn = document.getElementById("btnSaveEntireMenu");
  const originalText = saveBtn ? saveBtn.innerHTML : "";
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Salvataggio in corso...`;
  }

  try {
    // Salviamo ciascun piatto tramite la rotta POST /api/products/create
    for (const item of recentlyAddedMeals) {
      const payload = {
        restaurantId,
        mealId: item.originalMeal?._id,
        nameMeal: item.nameMeal,
        category: item.originalMeal?.category || "Altro",
        price: item.price,
        image: item.originalMeal?.image || "/assets/defaultMeal.jpeg",
        ingredients: item.ingredients
      };
      await createProduct(payload);
      
    }

    // Svuota la coda temporanea dei recenti dopo il salvataggio
    recentlyAddedMeals.length = 0;
    renderRecentAddedList();

    // Ricarica il menù effettivo nel pannello di sinistra
    await loadCurrentRestaurantMenu(restaurantId);

    // Chiudi l'offcanvas destro
    const offcanvasEl = document.getElementById("offcanvasRecentAdded");
    const offcanvasInst = bootstrap.Offcanvas.getInstance(offcanvasEl);
    if (offcanvasInst) offcanvasInst.hide();
    showAlert("success", "Prodotto salvato nel menù con successo")
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

/**
 * Carica dal database e renderizza i piatti salvati nel menù del ristoratore (Offcanvas Sinistro)
 */
async function loadCurrentRestaurantMenu(restaurantId) {
  if (!currentMenuList || !restaurantId) return;

  try {
    const res = await getRestaurantProducts(restaurantId);
    const products = res.data || [];
    const deleteAllBtn = document.getElementById("deleteAllBtn");

    if (products.length === 0) {
        currentMenuList.innerHTML = `
        <div class="menu-empty-msg" id="emptyCurrentMenuMsg">
            Il tuo menù è ancora vuoto.<br>Aggiungi i tuoi primi piatti dal catalogo!
        </div>`;

        deleteAllBtn.disabled = true;
      return;
    }

    deleteAllBtn.disabled = false;
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

      // Gestione eliminazione del piatto salvato sul Database
      const deleteBtn = item.querySelector(".btn-delete-recent");
      deleteBtn.addEventListener("click", async (event) => {
        event.stopPropagation();

        try {
          await deleteProduct(product._id);
          // Ricarica la lista aggiornata dal database
          await loadCurrentRestaurantMenu(restaurantId);
          showAlert("success", "Menù aggiornato con successo");
        } catch (error) {
          console.error("Errore durante l'eliminazione:", error);
          showAlert("danger", error);
        }
      });

      currentMenuList.appendChild(item);
    });

    deleteAllBtn.addEventListener("click", async(event) => {
      try {
          await deleteAllProduct(restaurantId);
          showAlert("success", "Menù eliminato con successo");
          currentMenuList.innerHTML = `
          <div class="menu-empty-msg" id="emptyCurrentMenuMsg">
            Il tuo menù è ancora vuoto.<br>Aggiungi i tuoi primi piatti dal catalogo!
          </div>`;
          deleteAllBtn.disabled = true;

      }catch(error) {
        console.error("Errore durante l'eliminazione di tutto il menù", error);
        showAlert("danger", "Attenzione", error)
      }
    });

  } catch (err) {
    console.error("Errore caricamento menù salvato:", err);
  }
}