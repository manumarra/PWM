import { getStoredUser } from "/utils/common/session.js";
import { getRestaurants } from "/services/userService.js";
import { showAlert } from "/components/alerts.js";

const USER = getStoredUser();

let currentPage = 1;
const LIMIT = 12;
let hasNextPage = true;
let isLoading = false;
let currentCity = "";
let currentSearch = "";
let currentDish = "";

const cityLabel = document.getElementById("customerCityLabel");
const searchInput = document.getElementById("searchRestaurantInput");
const restaurantCountLabel = document.getElementById("restaurantCountLabel");
const emptyRestaurantsMsg = document.getElementById("emptyRestaurantsMsg");
const scrollSentinel = document.getElementById("scrollSentinel");
const scrollSpinner = document.getElementById("scrollSpinner");
const restaurantsGrid = document.getElementById("restaurantsGrid");
const dishInput = document.getElementById("searchDishInput");

document.addEventListener("DOMContentLoaded", async () => {
  currentCity = USER?.address?.city || "";

  if (cityLabel) {
    cityLabel.textContent = currentCity || "Tutte le città";
  }

  // Ricerca con debounce: azzera la paginazione e ricarica dal server
  let debounceTimer = null;
  const onFilterChange = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearch = searchInput?.value.trim() || "";
      currentDish = dishInput?.value.trim() || "";
      resetAndReload();
    }, 300);
  };
  searchInput?.addEventListener("input", onFilterChange);
  dishInput?.addEventListener("input", onFilterChange);

  setupInfiniteScroll();
  await loadNextBatch();
});

/**
 * Carica il prossimo blocco di ristoranti dal server
 */
async function loadNextBatch() {
  if (isLoading || !hasNextPage) return;

  isLoading = true;
  scrollSpinner?.classList.remove("d-none");

  try {
    const response = await getRestaurants({
      page: currentPage,
      limit: LIMIT,
      city: currentCity,
      search: currentSearch,
      dish: currentDish
    });

    const restaurants = response?.data || [];
    const pagination = response?.pagination || {};

    if (currentPage === 1 && restaurants.length === 0) {
      emptyRestaurantsMsg?.classList.remove("d-none");
      if (restaurantCountLabel) restaurantCountLabel.textContent = "0 ristoranti trovati";
    } else {
      emptyRestaurantsMsg?.classList.add("d-none");
      appendRestaurants(restaurants);

      if (restaurantCountLabel && pagination.total !== undefined) {
        restaurantCountLabel.textContent = `${pagination.total} ${pagination.total === 1 ? "ristorante trovato" : "ristoranti trovati"}`;
      }
    }

    hasNextPage = Boolean(pagination.hasNext);
    currentPage = pagination.page + 1;
  } catch (error) {
    showAlert("danger", "Attenzione", error.message || "Errore nel caricamento dei ristoranti");
  } finally {
    isLoading = false;
    scrollSpinner?.classList.add("d-none");
  }
}

/**
 * Aggiunge le card dei ristoranti in fondo alla griglia
 */
function appendRestaurants(restaurants) {
  if (!restaurantsGrid) return;

  const fragment = document.createDocumentFragment();

  restaurants.forEach((restaurant) => {
    const col = document.createElement("div");
    col.className = "col";

    const addressText = restaurant.address
      ? `${restaurant.address.street || ""}, ${restaurant.address.city || ""}`
      : "Indirizzo non disponibile";
    const restPhone = restaurant.phone || "Non disponibile";
    const restImage = restaurant.image || "/assets/defaultAvatar.jpeg";

    col.innerHTML = `
      <div class="restaurant-card" data-restaurant-id="${restaurant._id}">
        <div class="restaurant-card-img-wrapper">
          <img src="${restImage}" alt="${restaurant.name}" onerror="this.src='/assets/defaultAvatar.jpeg'">
          <span class="restaurant-card-badge">Aperto</span>
        </div>
        
        <div class="card-body p-3 d-flex flex-column justify-content-between flex-grow-1">
          <div>
            <h5 class="restaurant-card-title text-truncate" title="${restaurant.name}">${restaurant.name}</h5>
            
            <div class="restaurant-info-row mb-1">
              <i class="bi bi-geo-alt-fill restaurant-info-icon"></i>
              <span class="text-truncate">${addressText}</span>
            </div>

            <div class="restaurant-info-row mb-3">
              <i class="bi bi-telephone-fill restaurant-info-icon"></i>
              <span>${restPhone}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const card = col.querySelector(".restaurant-card");
    if (card) {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");

      const goToMenu = () => {
        window.location.href = `/pages/customer/restaurantMenu.html?restaurantId=${restaurant._id}`;
      };

      // Navigazione al click
      card.addEventListener("click", goToMenu);

      // Navigazione da tastiera tramite tasto Invio
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          goToMenu();
        }
      });
    }

    fragment.appendChild(col);
  });

  restaurantsGrid.appendChild(fragment);
}

/**
 * Ripristina lo stato iniziale della griglia e ricarica la prima pagina
 */
async function resetAndReload() {
  currentPage = 1;
  hasNextPage = true;
  if (restaurantsGrid) restaurantsGrid.innerHTML = "";
  await loadNextBatch();
}

/**
 * Inizializza l'IntersectionObserver per il caricamento allo scroll
 */
function setupInfiniteScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isLoading) {
        loadNextBatch();
      }
    },
    { rootMargin: "250px" }
  );

  if (scrollSentinel) {
    observer.observe(scrollSentinel);
  }
}