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
    const updatedImage = document.getElementById("editProfileImgPreview")?.src || "/assets/defaultAvatar.jpeg";

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
            address,
            image: updatedImage
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
    const profileCardImg = document.getElementById("profileCardImg");
    const navAvatar = document.getElementById("navbarAvatarImg");
    const profileCardImgContent = document.getElementById("profileCardImgContent");

    if (navAvatar && USER?.image) {
        navAvatar.src = USER.image;
    }

    if(!isRestaurateur) {
        if (nameCanvas) nameCanvas.textContent = USER.name + " " + USER.surname || "";

    } else {
        if (nameCanvas) nameCanvas.textContent = USER.name || "";
        if (profileCardImgContent) profileCardImgContent.src = USER.image;     
        if (profileCardImg) profileCardImg.src = USER.image 
    }

    
    if (restaurantNameCanvas) restaurantNameCanvas.textContent = USER.email || "";

    // 2. Popola i campi del form della modale
    const form = document.getElementById("editProfileForm");
    const previewImg = document.getElementById("editProfileImgPreview");
    const fileInput = document.getElementById("editProfileFileInput");
    const urlInput = document.getElementById("editProfileImageUrl");
    if (form) {

        // 1. Mostra la foto salvata attualmente nel localStorage
        if (previewImg && USER?.image) {
            previewImg.src = USER.image;
            if (urlInput && !USER.image.startsWith("data:")) {
                urlInput.value = USER.image;
            }
        }

        // 2. Lettura file locale con FileReader (Base64)
        fileInput?.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (previewImg) previewImg.src = event.target.result;
                if (urlInput) urlInput.value = "";
            };
            reader.readAsDataURL(file);
            }
        });

        // 3. Modifica immediata da input URL web
        urlInput?.addEventListener("input", (e) => {
            const val = e.target.value.trim();
            if (previewImg) previewImg.src = val || "/assets/defaultAvatar.jpeg";
            if (val && fileInput) fileInput.value = "";
        });

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