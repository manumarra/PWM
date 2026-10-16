import { getRestaurantById } from "/services/userService.js";
import { getRestaurantProducts } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";

const heroSection = document.getElementById("restaurantHero");
const heroSpinner = document.getElementById("heroSpinner");
const bgImg = document.getElementById("heroBgImage");
const nameLabel = document.getElementById("restaurantNameLabel");
const addressLabel = document.getElementById("restaurantAddressLabel");
const phoneLabel = document.getElementById("restaurantPhoneLabel");

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get("restaurantId");

  if (!restaurantId) {
    showAlert("danger", "Attenzione", "Nessun ristorante selezionato");
    setTimeout(() => { window.location.href = "/pages/customer/home.html"; }, 1500);
    return;
  }

  await loadRestaurantDetails(restaurantId);
});

async function loadRestaurantDetails(restaurantId) {
  try {
    heroSpinner?.classList.remove("d-none");

    const response = await getRestaurantById(restaurantId);
    const restaurant = response?.data;

    if (!restaurant) {
      throw new Error("Ristorante non disponibile");
    }

    if (bgImg) {
      const imgSrc = restaurant.image || "/assets/sfondoCibi.jpg";
      bgImg.style.backgroundImage = `url('${imgSrc}')`;
    }

    if (nameLabel) nameLabel.textContent = restaurant.name || "Ristorante";
    
    if (addressLabel && restaurant.address) {
      addressLabel.textContent = `${restaurant.address.street || ""}, ${restaurant.address.city || ""}`;
    }
    
    if (phoneLabel) {
      phoneLabel.textContent = restaurant.phone || "Non disponibile";
    }

    heroSection?.classList.remove("d-none");
  } catch (err) {
    showAlert("danger", "Attenzione", err.message || "Impossibile caricare i dati del ristorante");
  } finally {
    heroSpinner?.classList.add("d-none");
  }
}