import { getStoredUser } from "/utils/session.js";
import { showAlert } from "/components/alerts.js";
import { updateUser, deleteUser } from "/services/userService.js";

const USER = getStoredUser();

const credentialForm = document.getElementById("editCredentialForm");

credentialForm.addEventListener("submit", async(event) => {

    event.preventDefault();

    const password = credentialForm.elements["password"].value;
    const confirmPassword = credentialForm.elements["confirmPassword"].value;
    const currentPassword = credentialForm.elements["currentPassword"].value;

    if(!password || !confirmPassword || !currentPassword) return showAlert("danger", "Attenzione", "Compilare tutti i campi")
    if(password !== confirmPassword) return showAlert("danger", "Attenzione", "Le nuove password non coincidono");

    const id = USER._id;

    const payload = {
        currentPassword,
        id,
        confirmPassword,
        updates: {
            password
        }
    }
    
    try {
        await updateUser(payload);
        showAlert("success", "Password modificata con successo!");
        
        const modalEl = document.getElementById("editCredentialModal");
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                modalInstance.hide();
            }
        }

    } catch (error) {
        console.error("Errore modifica password:", error);
        showAlert("danger", "Errore durante la modifica della password", error.message);
    }

});

const deleteForm = document.getElementById("deleteProfileForm");

deleteForm.addEventListener("submit", async(event) => {
    event.preventDefault();

    const password = deleteForm.elements["password"].value;
    if(!password) return showAlert("danger", "Attenzione", "elemento mancante nel DOM");
    
    const id = USER._id;

    const payload = {
        id,
        password
    }

    try {
        await deleteUser(payload);
        showAlert("success", "Account eliminato con successo!");
        setTimeout(() => {
            window.location.href = "/index.html";
        },500);

    } catch (error) {
        console.error("Errore modifica password:", error);
        showAlert("danger", "Errore durante la modifica della password", error.message);
    }

});