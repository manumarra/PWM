import { getStoredUser } from "/utils/session.js";

const user = getStoredUser();

if (user) {
    // 1. Popola le etichette dell'Offcanvas
    const nameLabel = document.getElementById("offcanvasRestaurateurName");
    const titleLabel = document.getElementById("offcanvasRestaurantTitle");
    const nameCanvas = document.getElementById("restaurateurName");
    const restaurantNameCanvas = document.getElementById("restaurantEmail");

    if (nameLabel) nameLabel.textContent = user.name || "restaurateur";
    if (titleLabel) titleLabel.textContent = user.email || "";

    if (nameCanvas) nameCanvas.textContent = user.name || "";
    if (restaurantNameCanvas) restaurantNameCanvas.textContent = user.email || "";

    // 2. Popola i campi del form della modale
    const form = document.getElementById("editProfileForm");
    if (form) {
        form.elements["name"].value = user.name || "";
        form.elements["email"].value = user.email || "";
        form.elements["phone"].value = user.phone || "";
        form.elements["vatNumber"].value = user.vatNumber || "";

        if (user.address) {
        form.elements["street"].value = user.address.street || "";
        form.elements["city"].value = user.address.city || "";
        form.elements["zip"].value = user.address.zip || "";
        form.elements["country"].value = user.address.country || "ITA";
        }
    }
}