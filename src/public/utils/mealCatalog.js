import { getMeals } from "/services/mealService.js";

let currentPage = 1;
const limit = 12;
let currentSearch = "";
let currentCategory = "";

let mealsGrid = null;
let emptyState = null;
let paginationContainer = null;
let onMealClickCallback = null;

/**
 * Inizializza il catalogo ricette collegando gli elementi DOM e il listener di selezione piatto
 */
export function initMealCatalog({ gridEl, emptyEl, paginationEl, onMealClick }) {
  mealsGrid = gridEl;
  emptyState = emptyEl;
  paginationContainer = paginationEl;
  onMealClickCallback = onMealClick;
}

/**
 * Carica ed elabora una specifica pagina del catalogo
 */
export async function fetchCatalogPage(page = 1) {
  if (!mealsGrid) return;
  
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
      emptyState?.classList.remove("d-none");
      if (paginationContainer) paginationContainer.innerHTML = "";
      return;
    }

    emptyState?.classList.add("d-none");
    renderMealCards(meals);
    renderPagination(pagination);

  } catch (err) {
    console.error("Errore caricamento catalogo:", err);
    mealsGrid.innerHTML = `
      <div class="col-12 text-center text-danger py-4">
        Impossibile caricare i piatti. Riprova più tardi.
      </div>`;
  }
}

/**
 * Aggiorna i filtri di ricerca/categoria e riavvia la paginazione da pagina 1
 */
export function updateCatalogFilters({ search, category }) {
  if (search !== undefined) currentSearch = search;
  if (category !== undefined) currentCategory = category;
  fetchCatalogPage(1);
}

/**
 * Renderizza le card del catalogo ricette
 */
function renderMealCards(meals) {
  if (!mealsGrid) return;
  mealsGrid.innerHTML = "";

  meals.forEach(meal => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    col.innerHTML = `
      <div class="card h-100 menu-modal-content border-0 shadow-sm overflow-hidden meal-card-clickable" role="button" tabindex="0">
        <img 
          src="${meal.image || '/assets/defaultMeal.jpeg'}" 
          class="card-img-top" 
          alt="${meal.nameMeal}" 
          style="height: 190px; object-fit: cover;" 
          onerror="this.src='/assets/defaultMeal.jpeg'"
        >
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

    const cardElement = col.querySelector(".meal-card-clickable");
    
    // Al click o Invio chiama la callback registrata
    cardElement.addEventListener("click", () => {
      if (typeof onMealClickCallback === "function") {
        onMealClickCallback(meal);
      }
    });

    cardElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && typeof onMealClickCallback === "function") {
        onMealClickCallback(meal);
      }
    });

    mealsGrid.appendChild(col);
  });
}

/**
 * Renderizza la numerazione e pulsanti avanti/indietro
 */
function renderPagination(pagination) {
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";
  if (!pagination || pagination.pages <= 1) return;

  const current = Number(pagination.page);
  const totalPages = Number(pagination.pages);

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

  // Pagine numerate
  const startPage = Math.max(1, current - 2);
  const endPage = Math.min(totalPages, current + 2);

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