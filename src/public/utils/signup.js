import { registerUser } from "/services/userService.js";
import { showAlert } from "/components/alerts.js";
let isCustomer = false;

document.addEventListener("DOMContentLoaded", () => {
  const switchBtn = document.getElementById("switchBtn");
  const card = document.getElementById("signupCard");
  const hero = document.getElementById("signupHero");
  const infoTitle = document.getElementById("infoTitle");
  const infoDesc = document.getElementById("infoDesc");
  const nameLabel = document.getElementById("nameLabel");
  const formEmoji = document.getElementById("formEmoji");
  const ivaContainer = document.getElementById("ivaContainer");
  const phoneCol = document.getElementById("phoneCol");
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

    // 3. A metà animazione aggiorna i contenuti e li fa riapparire
    setTimeout(() => {
      if (isCustomer) {
        formEmoji.textContent = "🍔🍕🥗";
        infoTitle.textContent = "Registrati come Cliente";
        infoDesc.textContent = "Ordina dai migliori ristoranti e ricevi il cibo caldo e veloce a casa tua.";
        nameLabel.textContent = "Nome Utente";
        ivaContainer.style.display = "none";
        ivaInput.required = false;
        ivaInput.value = "";
        phoneCol.className = "col-12";

      } else { 
        formEmoji.textContent = "👨‍🍳🍳👩‍🍳";
        infoTitle.textContent = "Registrati come Ristoratore";
        infoDesc.textContent = "Porta i tuoi piatti a migliaia di nuovi clienti nella tua città.";
        ivaContainer.style.display = "block";
        nameLabel.textContent = "Nome Ristorante / Titolare";
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
    name: signupForm.elements["name"].value,
    email: signupForm.elements["email"].value,
    password: signupForm.elements["password"].value,
    phone: signupForm.elements["phone"].value,
    role: role,
    address: {
      street: signupForm.elements["street"].value,
      city: signupForm.elements["city"].value,
      zip: signupForm.elements["zip"].value,
      country: signupForm.elements["country"].value
    }
  }
  if (isCustomer === false) {
    payload.ivaNumber = signupForm.elements["ivaNumber"].value;
  }

  try {
      const result = await registerUser(payload);

      // Mostra notifica di successo
      showAlert("success", "Registrazione completata!", "Reindirizzamento al login in corso...");

      // Attendi 2 secondi prima di cambiare pagina per godersi l'effetto visivo
      setTimeout(() => {
        window.location.href = "/pages/login.html";
      }, 1000);

    } catch (err) {
      // Mostra notifica di errore con il messaggio proveniente dal backend
      showAlert("danger", "Errore di Registrazione", err.message);
  }

});


