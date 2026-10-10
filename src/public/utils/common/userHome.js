import { getStoredUser, setStoredUser } from "/utils/common/session.js";
import { updateUser } from "/services/userService.js";
import { showAlert } from "/components/alerts.js";

var USER = getStoredUser();
const isRestaurateur = USER.role === "restaurateur" ? true : false;
showData();

const editForm = document.getElementById("editProfileForm");
editForm.addEventListener("submit", async(event) => {
    event.preventDefault();

    const currentPassword = editForm.elements["password"].value;
    const name = editForm.elements["nameUser"].value.trim();
    const phone = editForm.elements["phone"].value.trim();

    if(!currentPassword) return showAlert("danger", "Attenzione", "Elemento mancante nel DOM");

    const address = {
        street: editForm.elements["street"].value.trim(),
        city: editForm.elements["city"].value.trim(),
        zip: editForm.elements["zip"].value.trim(),
        country: editForm.elements["country"].value.trim()
    }
    
    const id = USER._id;

    const payload = {
        currentPassword,
        id,
        updates: {
            name,
            phone,
            address
        }
    }

    if(isRestaurateur) {
        const ivaNumber = editForm.elements["iva"].value.trim();
        if (ivaNumber) payload.updates.ivaNumber = ivaNumber;
    }

    if(!isRestaurateur) {
        const surname = editForm.elements["surname"].value.trim();
        if(surname) payload.updates.surname = surname;
    }

    try {
        const data = await updateUser(payload);
        
        setStoredUser(data.data);
        USER = getStoredUser();
        showData();
        showAlert("success", "Dati modificati con successo");

        const modalEl = document.getElementById("editProfileModal");
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
        
    } catch(error) {
        console.log("errore: ", error)
        showAlert("danger", "Errore durante la modifica dei dati: ", error.message)
    }

});

function showData() {
    // 1. Popola le etichette dell'Offcanvas
    const nameCanvas = document.getElementById("nameUserContent");
    const restaurantNameCanvas = document.getElementById("emailUserContent");

    if(!isRestaurateur) {
        if (nameCanvas) nameCanvas.textContent = USER.name + " " + USER.surname || "";

    } else { if (nameCanvas) nameCanvas.textContent = USER.name || ""; }

    
    if (restaurantNameCanvas) restaurantNameCanvas.textContent = USER.email || "";

    // 2. Popola i campi del form della modale
    const form = document.getElementById("editProfileForm");
    if (form) {
        form.elements["nameUser"].value = USER.name || "";

        if (form.elements["surname"]) form.elements["surname"].value = USER.surname || "";


        form.elements["phone"].value = USER.phone || "";
        if(isRestaurateur) form.elements["iva"].value = USER.ivaNumber || "";

        if (USER.address) {
        form.elements["street"].value = USER.address.street || "";
        form.elements["city"].value = USER.address.city || "";
        form.elements["zip"].value = USER.address.zip || "";
        form.elements["country"].value = USER.address.country;
        }
    }
}