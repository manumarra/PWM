import { registerUser } from "/services/userService.js";
import { showAlert } from "/components/alerts.js";

let isCustomer = false;

document.addEventListener("DOMContentLoaded", () => {
  const switchBtn = document.getElementById("switchBtn");
  const card = document.getElementById("signupCard");
  const hero = document.getElementById("signupHero");
  const infoTitle = document.getElementById("infoTitle");
  const infoDesc = document.getElementById("infoDesc");
  const formEmoji = document.getElementById("formEmoji");

  const nameCol = document.getElementById("nameCol");
  const nameLabel = document.getElementById("nameLabel");
  const surnameCol = document.getElementById("surnameCol");
  const phoneCol = document.getElementById("phoneCol");
  const ivaContainer = document.getElementById("ivaContainer");

  const signupForm = document.getElementById("signupForm");
  const surnameInput = signupForm.elements["surname"];
  const ivaInput = signupForm.elements["ivaNumber"];

  if (!switchBtn || !card || !hero) return;

  switchBtn.addEventListener("click", () => {
    isCustomer = !isCustomer;

    // 1. Inverte i pannelli e attiva la dissolvenza incrociata dello sfondo
    card.classList.toggle("is-customer");
    hero.classList.toggle("is-customer");

    // 2. Sfuma il testo prima di cambiarlo
    formEmoji.classList.add("is-fading");
    infoTitle.classList.add("is-fading");
    infoDesc.classList.add("is-fading");

    // 3. A metà animazione aggiorna i contenuti
    setTimeout(() => {
      if (isCustomer) {
        formEmoji.textContent = "🍔🍕🥗";
        infoTitle.textContent = "Registrati come Cliente";
        infoDesc.textContent = "Ordina dai migliori ristoranti e ricevi il cibo caldo e veloce a casa tua.";

        // Configurazione Nome e Cognome (2 colonne da 6)
        nameLabel.textContent = "Nome";
        nameCol.className = "col-6";
        surnameCol.style.display = "block";
        surnameInput.required = true;

        // Nasconde Partita IVA ed espande Telefono a riga intera
        ivaContainer.style.display = "none";
        ivaInput.required = false;
        ivaInput.value = "";
        phoneCol.className = "col-12";

      } else { 
        formEmoji.textContent = "👨‍🍳🍳👩‍🍳";
        infoTitle.textContent = "Registrati come Ristoratore";
        infoDesc.textContent = "Porta i tuoi piatti a migliaia di nuovi clienti nella tua città.";

        // Configurazione Nome Attività (riga intera col-12) e nasconde Cognome
        nameLabel.textContent = "Nome Attività";
        nameCol.className = "col-12";
        surnameCol.style.display = "none";
        surnameInput.required = false;
        surnameInput.value = "";

        // Mostra Partita IVA e divide con Telefono (2 colonne da 6)
        ivaContainer.style.display = "block";
        ivaInput.required = true;
        phoneCol.className = "col-6";
      }

      formEmoji.classList.remove("is-fading");
      infoTitle.classList.remove("is-fading");
      infoDesc.classList.remove("is-fading");
    }, 280);
  });
});

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const role = isCustomer ? "customer" : "restaurateur";

  const payload = {
    name: signupForm.elements["name"].value.trim(),
    email: signupForm.elements["email"].value.trim(),
    password: signupForm.elements["password"].value,
    phone: signupForm.elements["phone"].value.trim(),
    role: role,
    address: {
      street: signupForm.elements["street"].value.trim(),
      city: signupForm.elements["city"].value.trim(),
      zip: signupForm.elements["zip"].value.trim(),
      country: signupForm.elements["country"].value.trim().toUpperCase()
    }
  };

  if (isCustomer) {
    payload.surname = signupForm.elements["surname"].value.trim();
  } else {
    payload.ivaNumber = signupForm.elements["ivaNumber"].value.trim();
  }

  try {
    const result = await registerUser(payload);
    showAlert("success", "Registrazione completata!", "Reindirizzamento al login in corso...");

    setTimeout(() => {
      window.location.href = "/pages/login.html";
    }, 1000);
  } catch (err) {
    showAlert("danger", "Errore di Registrazione", err.message);
  }
});