import { getStoredUser, setStoredUser } from "/utils/session.js";
import { updateUser } from "/services/userService.js";
import { showAlert } from "/components/alerts.js";

var USER = getStoredUser();
showData();

const editForm = document.getElementById("editProfileForm");
editForm.addEventListener("submit", async(event) => {
    event.preventDefault();

    const password = editForm.elements["password"].value;

    const name = editForm.elements["nameRest"].value;
    const phone = editForm.elements["phone"].value;
    const ivaNumber = editForm.elements["iva"].value;
    const address = {
        street: editForm.elements["street"].value,
        city: editForm.elements["city"].value,
        zip: editForm.elements["zip"].value,
        country: editForm.elements["country"].value
    }
    
    const id = USER._id;

    const payload = {
        password,
        id,
        updates: {
            name,
            phone,
            ivaNumber,
            address
        }
    }

    try {
        const data = await updateUser(payload);
        setStoredUser(data.data);
        USER = getStoredUser();
        showData();
        showAlert("success", "Dati modificati con successo");
    } catch(error) {
        console.log("errore: ", error)
        showAlert("danger", "Errore durante la modifica dei dati: ", error.message)
    }

});

function showData() {
    // 1. Popola le etichette dell'Offcanvas
    const nameCanvas = document.getElementById("restaurateurName");
    const restaurantNameCanvas = document.getElementById("restaurantEmail");

    if (nameCanvas) nameCanvas.textContent = USER.name || "";
    if (restaurantNameCanvas) restaurantNameCanvas.textContent = USER.email || "";

    // 2. Popola i campi del form della modale
    const form = document.getElementById("editProfileForm");
    if (form) {
        form.elements["nameRest"].value = USER.name || "";
        form.elements["phone"].value = USER.phone || "";
        form.elements["iva"].value = USER.ivaNumber || "";

        if (USER.address) {
        form.elements["street"].value = USER.address.street || "";
        form.elements["city"].value = USER.address.city || "";
        form.elements["zip"].value = USER.address.zip || "";
        form.elements["country"].value = USER.address.country;
        }
    }
}