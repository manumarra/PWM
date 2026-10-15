import { getStoredUser } from "/utils/common/session.js";
import { getRestaurantsByCity } from "/services/userService.js";
import { showAlert } from "/components/alerts.js";

const USER = getStoredUser();
let allRestaurants = [];

const cityLabel = document.getElementById("customerCityLabel");
const searchInput = document.getElementById("searchRestaurantInput");
const restaurantCountLabel = document.getElementById("restaurantCountLabel");
const emptyRestaurantsMsg = document.getElementById("emptyRestaurantsMsg");
const loadingSpinner = document.getElementById("loadingSpinner");
const restaurantsGrid = document.getElementById("restaurantsGrid");

document.addEventListener("DOMContentLoaded", async () => {

    const customerCity = USER.address?.city || "";

    if(cityLabel) cityLabel.textContent = customerCity || "Tutte le città";

    let debounceTimer = null;
    searchInput?.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
        filterRestaurants(e.target.value.trim());
        }, 250);
    });

    await loadRestaurants(customerCity);
});

async function loadRestaurants(city) {
    try {
        loadingSpinner.classList.remove("d-none");
        const response = await getRestaurantsByCity(city);
        allRestaurants = response?.data || [];
        renderRestaurants(allRestaurants);
    } catch(error) {
        console.error(error);
        showAlert("danger", "Attenzione", error);
    } finally {
        loadingSpinner.classList.add("d-none");
    }
}

function renderRestaurants(restaurants) {
    if(!restaurantsGrid) return;
    restaurantsGrid.innerHTML = "";

    if(restaurants.length === 0) {
        emptyRestaurantsMsg?.classList.remove("d-none");
        return;
    } 
    emptyRestaurantsMsg?.classList.add("d-none");

    if(restaurantCountLabel) {
        restaurantCountLabel.innerHTML =`${restaurants.length} ${restaurants.length === 1 ? `ristorante trovato` : `ristoranti trovati`}`;
    }

    restaurants.forEach((restaurant) => {
        const col = document.createElement("div");
        col.className = "col";

        const addressText = restaurant.address ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}` : "Indirizzo non disponibile";
        const restPhone = restaurant.phone || "Non disponibile";
        const restImage = restaurant.image || "/assets/defaultAvatar.png";

        col.innerHTML = `
        <div class="restaurant-card" data-restaurant-id="${restaurant._id}">
            <div class="restaurant-card-img-wrapper">
            <img src="${restImage}" alt="${restaurant.name}">
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

            <button type="button" class="btn-amber-card mt-2">
                <i class="bi bi-menu-button-wide me-1"></i> Sfoglia Menù
            </button>
            </div>
        </div>
        `;

        // Click sulla card per andare a consultare il menù del ristorante
        col.querySelector(".restaurant-card")?.addEventListener("click", () => {
            window.location.href = `/pages/customer/restaurantMenu.html?restaurantId=${restaurant._id}`;
        });
        restaurantsGrid.appendChild(col);
    });
}

function filterRestaurants(query) {
  const q = query.toLowerCase();
  const filtered = allRestaurants.filter((r) => (r.name || "").toLowerCase().includes(q));
  renderRestaurants(filtered);
}