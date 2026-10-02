import {loginUser} from "/services/userService.js";
import {showAlert} from "/components/alerts.js";

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const email = loginForm.elements["email"].value.trim();
    const password = loginForm.elements["password"].value;
    console.log("xxxxxxx:", email, password);
    // 2. Validazione client-side
    if (!email || !password) {
        showAlert("danger", "Attenzione", "Inserisci sia l'email che la password.");
        return;
    }

    // Verifica formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert("danger", "Attenzione", "Inserisci un indirizzo email valido.");
        emailInput.focus();
        return;
    }

    // Verifica lunghezza minima password
    if (password.length < 6) {
        showAlert("danger", "Attenzione", "La password deve contenere almeno 6 caratteri.");
        passwordInput.focus();
        return;
    }

    const payload = {
        email: email,
        password: password
    }
    try {
        const data = await loginUser(payload);
        localStorage.setItem("user", JSON.stringify(data.data)); // Salva i dati dell'utente nel localStorage
        showAlert("success", "Autenticazione completata!", "Reindirizzamento al profilo in corso...");
        setTimeout(() => {
            if(data.data.role === "restaurateur") {
                window.location.href = "/pages/restaurateur/home.html"; // Modifica con la tua pagina di destinazione
            } else {
                window.location.href = "/pages/customer/home.html"; // Modifica con la tua pagina di destinazione per i clienti
            }
        },700);

    } catch (err) {
        console.error("Errore durante il login:", err);
        showAlert("danger", "Errore di Login", err.message);
    }
});
