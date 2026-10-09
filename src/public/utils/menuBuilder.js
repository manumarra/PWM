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
const btnCreateNewMeal = document.getElementById("btnCreateNewMeal");
const modalMealImageUrl = document.getElementById("modalMealImageUrl");
const modalMealImg = document.getElementById("modalMealImg");

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
        const name = document.getElementById("modalMealName").value.trim();

        // 1. Lettura sicura della categoria
        const catSelect = document.getElementById("modalMealCategory");
        const selectedOptionValue = catSelect ? catSelect.value : "";
        const customCatInput = document.getElementById("modalCustomCategoryInput");
        const customCatText = customCatInput ? customCatInput.value.trim() : "";

        let finalCategory = "Altro";
        if (selectedOptionValue === "custom") {
            // Se ha scelto l'opzione custom, usa il testo digitato (o 'Altro' se lasciato vuoto)
            finalCategory = customCatText || "Altro";
        } else if (selectedOptionValue) {
            // Categoria standard dal menu a tendina
            finalCategory = selectedOptionValue;
        }

        // 2. Lettura immagine
        const image = document.getElementById("modalMealImg").src || "/assets/defaultMeal.jpeg";

        let preservedMealId = null;

        if (activeModalMeal && activeModalMeal._id) {
            const originalTitle = (activeModalMeal.nameMeal || "").trim();
            const originalCat = (activeModalMeal.category || "Altro").trim();
            const originalImg = activeModalMeal.image || "/assets/defaultMeal.jpeg";
            const originalIngs = activeModalMeal.ingredients || [];

            const isTitleSame = name === originalTitle;
            const isCategorySame = finalCategory === originalCat;
            const isImageSame = image === originalImg;
            const areIngsSame = areIngredientsEqual(currentIngredients, originalIngs);

            // Se e solo se NESSUN campo è stato alterato (eccetto il prezzo), conserva il mealId
            if (isTitleSame && isCategorySame && isImageSame && areIngsSame) {
                preservedMealId = activeModalMeal._id;
            }
        }

        const updatedProduct = {
            nameMeal: name,
            category: finalCategory,
            price: parseFloat(price),
            image: image,
            ingredients: [...currentIngredients],
            mealId: preservedMealId, // Valorizzato solo se non sono state fatte modifiche
            originalMeal: activeModalMeal
        };

        if (editingRecentIndex !== null) {
            recentlyAddedMeals[editingRecentIndex] = updatedProduct;
            editingRecentIndex = null;
        } else {
            recentlyAddedMeals.unshift(updatedProduct);
        }

        renderRecentAddedList();

        const modalInst = bootstrap.Modal.getInstance(customizeModalElement);
        if (modalInst) modalInst.hide();
    });

    // 1. Gestione Categoria Personalizzata nella Modale
    const modalCategorySelect = document.getElementById("modalMealCategory");
    const modalCustomCatContainer = document.getElementById("modalCustomCategoryContainer");
    const modalCustomCatInput = document.getElementById("modalCustomCategoryInput");

    modalCategorySelect?.addEventListener("change", (event) => {
        if (event.target.value === "custom") {
            modalCustomCatContainer?.classList.remove("d-none");
            modalCustomCatInput?.focus();
        } else {
            modalCustomCatContainer?.classList.add("d-none");
            if (modalCustomCatInput) modalCustomCatInput.value = "";
        }
    });

    // 2. Caricamento Immagine da File Locale (Computer)
    const modalMealFileInput = document.getElementById("modalMealFileInput");
    const modalMealImg = document.getElementById("modalMealImg");
    const modalMealImageUrl = document.getElementById("modalMealImageUrl");

    modalMealFileInput?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Imposta l'anteprima e memorizza il base64 nell'src dell'immagine
                modalMealImg.src = event.target.result;
                if (modalMealImageUrl) modalMealImageUrl.value = ""; // Svuota l'URL web se carica un file locale
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. Anteprima da URL Web
    modalMealImageUrl?.addEventListener("input", (event) => {
        const val = event.target.value.trim();
        if (val) {
            modalMealImg.src = val;
            if (modalMealFileInput) modalMealFileInput.value = ""; // Svuota il file locale
        } else {
            modalMealImg.src = "/assets/defaultMeal.jpeg";
        }
    });

    // 4. Bottone "Crea Nuovo Piatto" nella barra superiore
    const btnCreateNewMeal = document.getElementById("btnCreateNewMeal");
    btnCreateNewMeal?.addEventListener("click", () => {
        openCreateNewMealModal();
    });

    // Aggiunta ingrediente personalizzato
    const btnAddIngredient = document.getElementById("btnAddIngredient");
    const customIngredientInput = document.getElementById("customIngredientInput");

    btnAddIngredient?.addEventListener("click", () => {
        addCustomIngredient();
    });

    customIngredientInput?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addCustomIngredient();
        }
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
    numLi.innerHTML = `<button class="page-link ${isActive ? 'btn-amber text-white border-0 bg-warning' : 'menu-search-input'}">${i}</button>`;
    
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
      if (item.ingredients.length === 0)  return showAlert("danger", "Attenzione", "I piatti devono contenere almeno 1 ingrediente");
      const payload = {
        restaurantId,
        mealId: item.mealId || null,
        nameMeal: item.nameMeal,
        category: item.category || item.originalMeal?.category || "Altro",
        price: item.price,
        image: item.image || item.originalMeal?.image || "/assets/defaultMeal.jpeg",
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

    // Istanza modale di conferma
    const confirmModalEl = document.getElementById("deleteAllMenuConfirmModal");
    const confirmModal = confirmModalEl ? bootstrap.Modal.getOrCreateInstance(confirmModalEl) : null;
    const confirmDeleteBtn = document.getElementById("confirmDeleteAllMenuBtn");

    // 1. Click su "Elimina Menù" nell'Offcanvas: mostra la modale carina
    deleteAllBtn.onclick = () => {
      if (confirmModal) confirmModal.show();
    };

    // 2. Click definitivo sul tasto rosso "Elimina Tutto" dentro la modale
    if (confirmDeleteBtn) {
      confirmDeleteBtn.onclick = async () => {
        try {
          if (confirmModal) confirmModal.hide();

          await deleteAllProduct(restaurantId);
          showAlert("success", "Menù eliminato con successo");

          // Aggiorna l'interfaccia dell'Offcanvas
          currentMenuList.innerHTML = `
            <div class="menu-empty-msg" id="emptyCurrentMenuMsg">
              Il tuo menù è ancora vuoto.<br>Aggiungi i tuoi primi piatti dal catalogo!
            </div>`;
          deleteAllBtn.disabled = true;

        } catch (error) {
          console.error("Errore durante l'eliminazione di tutto il menù:", error);
          showAlert("danger", "Attenzione", error);
        }
      };
    }

  } catch (err) {
    console.error("Errore caricamento menù salvato:", err);
  }
}

/**
 * Apre la modale per personalizzare un piatto esistente dal catalogo
 */
function openCustomizeModal(meal) {
    activeModalMeal = meal;
    editingRecentIndex = null;
    currentIngredients = [...(meal.ingredients || [])];
  
    // Allinea il titolo e il bottone interno della modale
    document.getElementById("customizeMealModalLabel").textContent = "Personalizza Piatto";
    const modalBtn = document.getElementById("modalSubmitBtn");
    if (modalBtn) modalBtn.textContent = "Aggiungi al Menù";

    const mealTitle = meal.nameMeal || meal.strMeal || "";
    const mealImg = meal.image || meal.strMealThumb || "/assets/defaultMeal.jpeg";
    const mealCat = meal.category || meal.strCategory || "Altro";

    document.getElementById("modalMealName").value = mealTitle;
    document.getElementById("modalMealPrice").value = "";

    // Gestione categoria nel select o custom
    const catSelect = document.getElementById("modalMealCategory");
    const customContainer = document.getElementById("modalCustomCategoryContainer");
    const customInput = document.getElementById("modalCustomCategoryInput");

    const existsInOptions = Array.from(catSelect.options).some(o => o.value === mealCat);
    if (existsInOptions) {
        catSelect.value = mealCat;
        customContainer?.classList.add("d-none");
        if (customInput) customInput.value = "";
    } else {
        catSelect.value = "custom";
        customContainer?.classList.remove("d-none");
        if (customInput) customInput.value = mealCat;
    }

    // Anteprima e pulizia input caricamento
    document.getElementById("modalMealImg").src = mealImg;
    if (document.getElementById("modalMealFileInput")) document.getElementById("modalMealFileInput").value = "";
    if (document.getElementById("modalMealImageUrl")) document.getElementById("modalMealImageUrl").value = mealImg.startsWith("data:") ? "" : mealImg;
    if (document.getElementById("customIngredientInput")) document.getElementById("customIngredientInput").value = "";

    renderIngredientPills();

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

/**
 * Apre la modale per creare un piatto originale da zero
 */
function openCreateNewMealModal() {
    activeModalMeal = null;
    editingRecentIndex = null;
    currentIngredients = [];

    // Allinea il titolo e il bottone interno della modale
    document.getElementById("customizeMealModalLabel").textContent = "Crea Nuovo Piatto";
    const modalBtn = document.getElementById("modalSubmitBtn");
    if (modalBtn) modalBtn.textContent = "Aggiungi al Menù";

    // Resetta campi
    document.getElementById("modalMealName").value = "";
    document.getElementById("modalMealPrice").value = "";
    
    // Resetta categoria
    document.getElementById("modalMealCategory").value = "Altro";
    document.getElementById("modalCustomCategoryContainer")?.classList.add("d-none");
    if (document.getElementById("modalCustomCategoryInput")) {
        document.getElementById("modalCustomCategoryInput").value = "";
    }

    // Resetta immagine e input file/url
    document.getElementById("modalMealImg").src = "/assets/defaultMeal.jpeg";
    if (document.getElementById("modalMealFileInput")) document.getElementById("modalMealFileInput").value = "";
    if (document.getElementById("modalMealImageUrl")) document.getElementById("modalMealImageUrl").value = "";
    if (document.getElementById("customIngredientInput")) document.getElementById("customIngredientInput").value = "";

    renderIngredientPills();

    const modalInst = bootstrap.Modal.getOrCreateInstance(customizeModalElement);
    modalInst.show();
}

/**
 * Verifica se due liste di ingredienti sono identiche (stessi elementi nello stesso ordine)
 */
function areIngredientsEqual(arr1 = [], arr2 = []) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val.trim() === (arr2[index] || "").trim());
}